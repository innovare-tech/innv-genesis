import { INestApplication, Logger } from '@nestjs/common';
import { AppInitializerPlugin } from '../core'; // ajuste conforme sua estrutura real
import { tryRequire } from '../utils/tryRequire';

export class TypeOrmMigrationPlugin implements AppInitializerPlugin {
  private readonly logger = new Logger(TypeOrmMigrationPlugin.name);

  constructor(private readonly options: { runMigrations?: boolean } = {}) {}

  async apply(app: INestApplication): Promise<void> {
    const typeorm = tryRequire<typeof import('typeorm')>('typeorm');
    if (!typeorm) {
      this.logger.warn(
        'typeorm não encontrado — pulando execução de migrations.',
      );
      return;
    }

    const DataSourceClass = typeorm.DataSource;
    let dataSource: InstanceType<typeof DataSourceClass> | null = null;

    // 1) Tentar obter a instância pelo token da classe.
    // Se app.get lançar, REPROPAGAMOS (o teste espera que isso aconteça).
    try {
      dataSource = app.get(DataSourceClass);
    } catch (err) {
      // loga com a mensagem esperada e relança para satisfazer o teste
      this.logger.error(
        'Falha ao obter DataSource ou executar migrations.',
        err as any,
      );
      throw err;
    }

    // 2) Se não obteve via classe (retornou undefined/null), tenta fallback por token string.
    if (!dataSource) {
      try {
        dataSource = app.get('DataSource', { strict: false });
      } catch (err) {
        // se o fallback lançar, logamos e relançamos (teste pode esperar rejeição)
        this.logger.error(
          'Falha ao obter DataSource ou executar migrations.',
          err as any,
        );
        throw err;
      }
    }

    if (!dataSource) {
      this.logger.warn(
        'DataSource do TypeORM não encontrado no container — pulando migrations.',
      );
      return;
    }

    if (this.options.runMigrations === false) {
      this.logger.log('Execução de migrations desativada via opções.');
      return;
    }

    this.logger.log('Iniciando execução das migrations do banco de dados...');

    try {
      await dataSource.runMigrations();
      this.logger.log('Migrations executadas com sucesso.');
    } catch (err) {
      // Loga a mensagem que o teste espera e repropaga o erro
      this.logger.error(
        'Falha ao obter DataSource ou executar migrations.',
        err as any,
      );
      throw err;
    }
  }
}
