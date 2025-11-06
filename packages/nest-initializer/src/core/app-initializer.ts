import 'reflect-metadata';

import { createNexusClientProvider, NexusModule } from '@innv/nexus';

import {
  CanActivate,
  ClassSerializerInterceptor,
  DynamicModule,
  ExceptionFilter,
  ForwardReference,
  INestApplication,
  Logger,
  Module,
  NestInterceptor,
  PipeTransform,
  Type,
  ValidationPipe,
  ValidationPipeOptions,
  VersioningOptions,
} from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { ConfigModule } from '@nestjs/config';
import {
  AbstractHttpAdapter,
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_PIPE,
  NestFactory,
  Reflector,
} from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';

import { discoverComponents } from './auto-discovery.helper';
import { validateConfig } from './config-validator.helper';
import {
  MetricsModule,
  TerminusHealthCheckModule,
  TerminusHealthCheckOptions,
} from '../features';
import {
  CachingStarterOptions,
  createCachingStarter,
  createMongooseStarter,
  createTypeOrmStarter,
  MongooseStarterOptions,
  TypeOrmStarterOptions,
} from '../starters';
import {
  ResponseMapper,
  ResponsePatternInterceptor,
} from '../interceptors/response-pattern.interceptor';
import {
  createIndexPageController,
  IndexPageOptions,
} from '../features/index-page.factory';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
import { RequestLoggerPlugin } from '../plugins/request-logger.plugin';
import { RateLimiterPlugin } from '../plugins/rate-limiter.plugin';

type AnyModule =
  | Type
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference;

/**
 * Interface que todos os plugins do AppInitializer devem implementar.
 */
export interface AppInitializerPlugin {
  /**
   * Método que será executado durante a inicialização para aplicar a lógica do plugin.
   * Pode ser síncrono ou assíncrono.
   * @param app A instância da aplicação NestJS (INestApplication).
   */
  apply(app: INestApplication): Promise<void> | void;
}

/**
 * Representa uma tag na documentação Swagger (OpenAPI).
 */
export type SwaggerDocumentTags = {
  name: string;
  description?: string;
};

/**
 * Opções para a configuração do Swagger (OpenAPI).
 */
export type SwaggerOptions = {
  title: string;
  description: string;
  version: string;
  tags?: SwaggerDocumentTags[];
  path?: string;
  documentOptions?: SwaggerDocumentOptions;
  customOptions?: SwaggerCustomOptions;
};

/**
 * Assinatura da função de callback usada para configurar o inicializador.
 * @param app A instância do AppInitializer a ser configurada.
 */
type AppConfigurator<T extends INestApplication> = (
  app: AppInitializer<T>,
) => void;

/**
 * Uma classe fluente (Builder) para inicializar uma aplicação NestJS de forma declarativa.
 */
export class AppInitializer<T extends INestApplication = INestApplication> {
  private app!: T;
  private readonly module: Type;
  private readonly adapter?: AbstractHttpAdapter;
  private readonly options?: NestApplicationOptions;
  private readonly logger = new Logger(AppInitializer.name);

  private port: number = parseInt(process.env.PORT || '3000', 10);
  private globalPrefix?: string;
  private versioningOptions?: VersioningOptions;
  private corsOptions?: CorsOptions;
  private swaggerOptions?: SwaggerOptions;
  private readonly setupFunctions: ((app: INestApplication) => void)[] = [];
  private readonly plugins: AppInitializerPlugin[] = [];
  private readonly featureModules: AnyModule[] = [];

  private autoDiscoveredComponents?: {
    providers: Type[];
    controllers: Type[];
    nexusClients: Type[];
  };
  private readonly globalProviders: Provider[] = [];
  private readonly nexusClientProviders: Provider[] = [];
  private readonly globalInterceptors: NestInterceptor[] = [];
  private readonly factoryGeneratedControllers: Type[] = [];
  private readonly excludedRoutes: string[] = [];

  private constructor(
    module: Type,
    adapter?: AbstractHttpAdapter,
    options?: NestApplicationOptions,
  ) {
    this.module = module;
    this.adapter = adapter;
    this.options = options;
  }

  /**
   * Aplica um conjunto de configurações padrão recomendadas para o ambiente de desenvolvimento.
   * Inclui Swagger e um logger de requisições.
   * @param swaggerOptions Opções para customizar a documentação Swagger.
   */
  public useDevelopmentDefaults(
    swaggerOptions: Omit<SwaggerOptions, 'path'>,
  ): this {
    this.withSwagger({ ...swaggerOptions, path: 'docs' });
    this.withPlugin(new RequestLoggerPlugin());
    return this;
  }

  /**
   * Aplica um conjunto de configurações padrão recomendadas para o ambiente de produção.
   * Inclui Helmet, compressão, graceful shutdown e um rate limiter básico.
   */
  public useProductionDefaults(): this {
    this.useHelmet();
    this.enableCompression();
    this.withGracefulShutdown();
    this.withPlugin(new RateLimiterPlugin());
    return this;
  }

  /**
   * Aplica um bloco de configurações de forma condicional.
   * @param condition A condição booleana. Se for `true`, o callback de configuração será executado.
   * @param configure A função de callback que recebe o builder para aplicar as configurações.
   */
  public when(condition: boolean, configure: (builder: this) => void): this {
    if (condition) {
      configure(this);
    }
    return this;
  }

  public withHealthCheck(options: TerminusHealthCheckOptions): this {
    this.featureModules.push(TerminusHealthCheckModule.forRoot(options));
    return this;
  }

  /**
   * Habilita a coleta e exposição de métricas no padrão Prometheus
   * no endpoint /metrics. Inclui métricas padrão do Node.js
   * e métricas de latência de requisições HTTP.
   */
  public withMetrics(): this {
    this.featureModules.push(MetricsModule.forRoot());
    return this;
  }

  public static async bootstrap<T extends INestApplication = INestApplication>(
    module: Type,
    configurator: AppConfigurator<T>,
    options?: NestApplicationOptions,
  ): Promise<void>;

  public static async bootstrap<T extends INestApplication = INestApplication>(
    module: Type,
    adapter: AbstractHttpAdapter,
    configurator: AppConfigurator<T>,
    options?: NestApplicationOptions,
  ): Promise<void>;

  /**
   * Ponto de entrada estático para criar, configurar e iniciar a aplicação.
   * @param module O módulo raiz da aplicação (ex: AppModule).
   * @param adapterOrConfigurator O adaptador HTTP ou a função de configuração.
   * @param configurator Uma função de callback que recebe o builder para aplicar as configurações.
   * @param options Opções adicionais para a aplicação NestJS.
   */
  public static async bootstrap<T extends INestApplication = INestApplication>(
    module: Type,
    adapterOrConfigurator: AbstractHttpAdapter | AppConfigurator<T>,
    configurator?: AppConfigurator<T> | NestApplicationOptions,
    options?: NestApplicationOptions,
  ): Promise<void> {
    const isConfiguratorOnly = typeof adapterOrConfigurator === 'function';
    const adapter = isConfiguratorOnly ? undefined : adapterOrConfigurator;
    const finalConfigurator = isConfiguratorOnly
      ? adapterOrConfigurator
      : (configurator as AppConfigurator<T> | undefined);
    const finalOptions = isConfiguratorOnly
      ? (configurator as NestApplicationOptions | undefined)
      : options;

    if (!finalConfigurator) {
      throw new TypeError(
        'Função de configuração do bootstrap não encontrada. Verifique os argumentos.',
      );
    }

    const initializer = new AppInitializer<T>(module, adapter, finalOptions);
    try {
      initializer.logger.log(
        'Iniciando o processo de bootstrap da aplicação...',
      );
      finalConfigurator(initializer);
      await initializer.listen();
    } catch (error) {
      if (error instanceof Error) {
        initializer.logger.error(
          `Falha ao inicializar a aplicação. Error: ${error.message}`,
          error.stack,
        );
      } else {
        initializer.logger.error(
          'Falha ao inicializar a aplicação com um erro não-padrão.',
          error,
        );
      }
      process.exit(1);
    }
  }

  /**
   * Define a porta em que a aplicação vai rodar.
   * @param port O número da porta.
   */
  public onPort(port: number): this {
    this.port = port;
    return this;
  }

  /**
   * Registra um plugin para ser executado durante a inicialização.
   * @param plugin Uma instância de um objeto que implementa a interface AppInitializerPlugin.
   */
  public withPlugin(plugin: AppInitializerPlugin): this {
    this.plugins.push(plugin);
    return this;
  }

  /**
   * Habilita e configura o versionamento da API.
   * @param options As opções de versionamento do NestJS.
   */
  public withVersioning(options: VersioningOptions): this {
    this.versioningOptions = options;
    return this;
  }

  /**
   * Define um prefixo global para todas as rotas da aplicação (ex: /api/v1).
   * @param prefix O prefixo a ser aplicado.
   */
  public withGlobalPrefix(prefix: string): this {
    this.globalPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
    return this;
  }

  /**
   * Habilita e configura o Cross-Origin Resource Sharing (CORS).
   * @param options As opções de configuração do CORS.
   */
  public withCors(options: CorsOptions = {}): this {
    this.corsOptions = options;
    return this;
  }

  /**
   * Adiciona o ValidationPipe global com opções customizadas.
   * Esta é a forma recomendada de habilitar a validação padrão.
   * @param options Opções de configuração para o ValidationPipe.
   */
  public withValidationPipe(options: ValidationPipeOptions = {}): this {
    const defaultOptions: ValidationPipeOptions = {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    };
    const finalOptions = { ...defaultOptions, ...options };

    this.globalProviders.push({
      provide: APP_PIPE,
      useValue: new ValidationPipe(finalOptions),
    });
    return this;
  }

  /**
   * Registra um Pipe global customizado (ex: um pipe de parsing).
   * O pipe participará da Injeção de Dependência.
   * @param pipe A *classe* do pipe a ser registrada.
   */
  public useGlobalPipe(pipe: Type<PipeTransform>): this {
    this.globalProviders.push({
      provide: APP_PIPE,
      useClass: pipe,
    });
    return this;
  }

  /**
   * Registra um Filtro de Exceção global (ex: HttpExceptionFilter).
   * O filtro participará da Injeção de Dependência.
   * @param filter A *classe* do filtro a ser registrada.
   */
  public useGlobalFilter(filter: Type<ExceptionFilter>): this {
    this.globalProviders.push({
      provide: APP_FILTER,
      useClass: filter,
    });
    return this;
  }

  /**
   * Registra um Guard global (ex: JwtAuthGuard).
   * O guard participará da Injeção de Dependência.
   * @param guard A *classe* do guard a ser registrada.
   */
  public useGlobalGuard(guard: Type<CanActivate>): this {
    this.globalProviders.push({
      provide: APP_GUARD,
      useClass: guard,
    });
    return this;
  }

  /**
   * Registra um Interceptor global (ex: LoggingInterceptor).
   * O interceptor participará da Injeção de Dependência.
   * @param interceptor A *classe* do interceptor a ser registrada.
   */
  public useGlobalInterceptor(interceptor: Type<NestInterceptor>): this {
    this.globalProviders.push({
      provide: APP_INTERCEPTOR,
      useClass: interceptor,
    });
    return this;
  }

  /**
   * Registra o ClassSerializerInterceptor globalmente.
   * Essencial para transformações de DTO (@Exclude, @Expose).
   * Ele automaticamente recebe o Reflector via DI.
   */
  public withClassSerializer(): this {
    this.globalProviders.push({
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    });
    return this;
  }

  /**
   * Habilita e configura a documentação da API via Swagger (OpenAPI).
   * @param options As opções para construir a documentação.
   */
  public withSwagger(options: SwaggerOptions): this {
    this.swaggerOptions = { path: 'docs', ...options };
    return this;
  }

  /**
   * Habilita os 'shutdown hooks' do NestJS para um desligamento gracioso.
   */
  public withGracefulShutdown(): this {
    this.setupFunctions.push((app) => app.enableShutdownHooks());
    return this;
  }

  /**
   * Adiciona o middleware de segurança Helmet com configurações padrão.
   */
  public useHelmet(): this {
    this.setupFunctions.push((app) => app.use(helmet()));
    return this;
  }

  /**
   * Adiciona o middleware de compressão (gzip) para as respostas.
   */
  public enableCompression(): this {
    this.setupFunctions.push((app) => app.use(compression()));
    return this;
  }

  /**
   * Carrega e valida as variáveis de ambiente na inicialização
   * usando um schema de validação (classe com decoradores class-validator).
   * Se a validação falhar, a aplicação não será iniciada.
   * @param schema A classe de schema para validar (ex: EnvironmentVariables).
   */
  public withValidatedConfig<T extends object>(schema: Type<T>): this {
    const configModule = ConfigModule.forRoot({
      isGlobal: true,

      validate: (config) => validateConfig(config, schema),
    });

    this.featureModules.push(configModule);
    return this;
  }

  /**
   * Configura e registra automaticamente o TypeOrmModule (Estilo "Starter").
   * @param options Opções para o "Starter" de TypeORM.
   */
  public withTypeOrm(options: TypeOrmStarterOptions = {}): this {
    const starter = createTypeOrmStarter(options);

    this.featureModules.push(starter.module);

    for (const plugin of starter.plugins) {
      this.withPlugin(plugin);
    }

    return this;
  }

  /**
   * Configura e registra automaticamente o MongooseModule (Estilo "Starter").
   * Usa a configuração global (de .withValidatedConfig) para se conectar
   * ao MongoDB e descobre schemas automaticamente.
   *
   * @param options Opções para o "Starter" de Mongoose.
   */
  public withMongoose(options: MongooseStarterOptions = {}): this {
    const starter = createMongooseStarter(options);

    this.featureModules.push(starter.module);

    return this;
  }

  /**
   * Configura e registra automaticamente o CacheModule (Estilo "Starter").
   * Usa a configuração global (de .withValidatedConfig) para se conectar
   * ao Redis e torna o cache globalmente disponível.
   *
   * @param options Opções para o "Starter" de Cache.
   */
  public withCaching(options: CachingStarterOptions = {}): this {
    const cacheDynamicModule = createCachingStarter(options);

    this.featureModules.push(cacheDynamicModule);

    return this;
  }

  /**
   * Retorna a instância da aplicação NestJS (INestApplication) após a inicialização.
   * @throws Error se a aplicação ainda não foi inicializada.
   */
  public getApp(): T {
    return this.app;
  }

  /**
   * Habilita a descoberta e registro automático de Providers, Controllers
   * e Clientes @innv/nexus.
   * Varre o projeto e os adiciona ao módulo raiz.
   * @param options Opções para configurar a descoberta.
   */
  public withAutoDiscovery(options: { basePath: string }): this {
    const reflector = new Reflector();

    this.autoDiscoveredComponents = discoverComponents(
      options.basePath,
      reflector,
    );

    this.logger.log(
      `[Initializer] Auto-discovery encontrou ${this.autoDiscoveredComponents.providers.length} providers e ${this.autoDiscoveredComponents.controllers.length} controllers.`,
    );

    if (this.autoDiscoveredComponents.nexusClients.length > 0) {
      this.logger.log(
        `[Initializer] Auto-discovery encontrou ${this.autoDiscoveredComponents.nexusClients.length} clientes Nexus.`,
      );

      this.featureModules.push(NexusModule);

      for (const clientClass of this.autoDiscoveredComponents.nexusClients) {
        this.nexusClientProviders.push(createNexusClientProvider(clientClass));
      }
    }

    return this;
  }

  /**
   * Cria um controller dinâmico para servir um arquivo HTML estático (ex: index.html).
   * O arquivo deve estar em um diretório 'public' na raiz do projeto.
   * @param options Opções para configurar o path da rota e o nome do arquivo.
   */
  public withIndexPage(options: IndexPageOptions = {}): this {
    const controllerPath = options.path ?? '/';
    const IndexController = createIndexPageController(options);

    this.factoryGeneratedControllers.push(IndexController);
    this.excludedRoutes.push(controllerPath);

    return this;
  }

  /**
   * Adiciona um Interceptor global diretamente (instância).
   * @param interceptor
   */
  public addGlobalInterceptor(interceptor: NestInterceptor): this {
    this.globalInterceptors.push(interceptor);
    return this;
  }

  /**
   * Adiciona um ResponseMapper global para padronizar respostas.
   * @param mapper
   */
  public withResponseMapper<T>(mapper: ResponseMapper<T>): this {
    this.globalInterceptors.push(new ResponsePatternInterceptor(mapper));

    return this;
  }

  private async listen(): Promise<void> {
    this.logger.log('Criando a instância da aplicação NestJS...');

    const rootImports: AnyModule[] = [this.module, ...this.featureModules];

    const allProviders: Provider[] = [
      ...(this.autoDiscoveredComponents?.providers ?? []),
      ...this.globalProviders,
      ...this.nexusClientProviders,
    ];

    const allControllers = [
      ...(this.autoDiscoveredComponents?.controllers ?? []),
      ...this.factoryGeneratedControllers,
    ];

    @Module({
      imports: rootImports,
      controllers: allControllers,
      providers: allProviders,
    })
    class DynamicRootModule {}

    this.app = this.adapter
      ? await NestFactory.create<T>(
          DynamicRootModule,
          this.adapter,
          this.options,
        )
      : await NestFactory.create<T>(DynamicRootModule, this.options);

    if (this.globalPrefix)
      this.app.setGlobalPrefix(this.globalPrefix, {
        exclude: this.excludedRoutes,
      });
    if (this.corsOptions) this.app.enableCors(this.corsOptions);

    if (this.versioningOptions) {
      this.app.enableVersioning(this.versioningOptions);
    }

    for (const setup of this.setupFunctions) {
      setup(this.app);
    }

    for (const plugin of this.plugins) {
      this.logger.log(`Aplicando o plugin: ${plugin.constructor.name}`);
      await plugin.apply(this.app);
    }

    for (const interceptor of this.globalInterceptors) {
      this.app.useGlobalInterceptors(interceptor);
    }

    if (this.swaggerOptions) {
      const documentBuilder = new DocumentBuilder()
        .setTitle(this.swaggerOptions.title)
        .setDescription(this.swaggerOptions.description)
        .setVersion(this.swaggerOptions.version);

      for (const tag of this.swaggerOptions.tags ?? []) {
        documentBuilder.addTag(tag.name, tag.description);
      }

      const config = documentBuilder.build();
      const document = SwaggerModule.createDocument(
        this.app,
        config,
        this.swaggerOptions.documentOptions,
      );

      SwaggerModule.setup(
        this.swaggerOptions.path ?? 'docs',
        this.app,
        document,
        this.swaggerOptions.customOptions,
      );
    }

    await this.app.listen(this.port);

    const appUrl = await this.app.getUrl();
    this.logger.log(`🚀 Aplicação rodando em: ${appUrl}`);

    if (this.swaggerOptions) {
      const swaggerPath = this.swaggerOptions.path ?? 'docs';
      this.logger.log(
        `📄 Documentação Swagger disponível em: ${appUrl}/${swaggerPath}`,
      );
    }
  }
}
