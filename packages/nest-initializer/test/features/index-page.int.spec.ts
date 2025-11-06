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
    tmpDir = fs.mkdtempSync(join(os.tmpdir(), 'index-page-test-'));
    const publicDir = join(tmpDir, 'public');
    fs.mkdirSync(publicDir);
    const indexPath = join(publicDir, 'index.html');
    fs.writeFileSync(
      indexPath,
      '<html><body>hello from test</body></html>',
      'utf8',
    );

    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    const DynamicController = createIndexPageController();
    const moduleRef = await Test.createTestingModule({
      controllers: [DynamicController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    cwdSpy.mockRestore();
    if (app) await app.close();

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
