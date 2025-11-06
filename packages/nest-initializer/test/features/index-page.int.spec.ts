import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createIndexPageController } from '../../src/features/index-page.factory';
import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';

describe('Index route (integration)', () => {
  let app: INestApplication;
  let cwdSpy: jest.SpyInstance;
  let tmpDir: string;

  beforeAll(async () => {
    // 1) cria um diretório temporário e escreve um index.html
    tmpDir = fs.mkdtempSync(join(os.tmpdir(), 'index-page-test-'));
    const publicDir = join(tmpDir, 'public');
    fs.mkdirSync(publicDir);
    const indexPath = join(publicDir, 'index.html');
    fs.writeFileSync(
      indexPath,
      '<html><body>hello from test</body></html>',
      'utf8',
    );

    // 2) mocka process.cwd() para apontar para o temp dir
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    // 3) cria e inicializa app com o controller dinâmico
    const DynamicController = createIndexPageController(); // usa defaults: path '/', publicDir 'public', filename 'index.html'
    const moduleRef = await Test.createTestingModule({
      controllers: [DynamicController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // restaura spy e fecha app
    cwdSpy.mockRestore();
    if (app) await app.close();

    // remove arquivos criados (sincronamente)
    try {
      const publicDir = join(tmpDir, 'public');
      fs.unlinkSync(join(publicDir, 'index.html'));
      fs.rmdirSync(publicDir);
      fs.rmdirSync(tmpDir);
    } catch (err) {
      // ignore
    }
  });

  it('GET / should return the index file (200)', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(/hello from test/);
  });
});
