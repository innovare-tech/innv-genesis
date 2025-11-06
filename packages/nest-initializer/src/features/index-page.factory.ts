import 'reflect-metadata';
import { Controller, Get, Res, Type, VERSION_NEUTRAL } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

export interface IndexPageOptions {
  /**
   * O path da rota para servir o arquivo.
   * @default '/'
   */
  path?: string;
  /**
   * O nome do arquivo HTML dentro do diretório público.
   * @default 'index.html'
   */
  filename?: string;
  /**
   * O nome do diretório estático na raiz do projeto.
   * @default 'public'
   */
  publicDir?: string;
}

export function createIndexPageController(
  options: IndexPageOptions = {},
): Type {
  const routePath = options.path ?? '/';
  const htmlFile = options.filename ?? 'index.html';
  const publicDir = options.publicDir ?? 'public';

  const filePath = join(process.cwd(), publicDir, htmlFile);

  @Controller({ path: routePath, version: VERSION_NEUTRAL })
  class DynamicIndexController {
    @Get()
    serveIndex(@Res() res: Response): void {
      res.sendFile(filePath);
    }
  }

  return DynamicIndexController;
}
