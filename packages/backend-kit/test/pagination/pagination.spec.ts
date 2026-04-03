import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  PaginatedQueryParamsDTO,
  SortOrder,
} from '../../src/pagination/paginated-query-params.dto';
import { PaginatedQueryResultDTO } from '../../src/pagination/paginated-query-result.dto';
import { SearchableQueryParamsDTO } from '../../src/pagination/searchable-query-params.dto';

describe('PaginatedQueryParamsDTO', () => {
  it('should validate successfully with page:1 and limit:10', async () => {
    const dto = plainToInstance(PaginatedQueryParamsDTO, {
      page: '1',
      limit: '10',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('should fail validation with page:0 (@IsPositive)', async () => {
    const dto = plainToInstance(PaginatedQueryParamsDTO, {
      page: '0',
      limit: '10',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const pageError = errors.find((e) => e.property === 'page');
    expect(pageError).toBeDefined();
  });

  it('should fail validation with negative limit', async () => {
    const dto = plainToInstance(PaginatedQueryParamsDTO, {
      page: '1',
      limit: '-5',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const limitError = errors.find((e) => e.property === 'limit');
    expect(limitError).toBeDefined();
  });

  it('should fail validation with invalid sortOrder', async () => {
    const dto = plainToInstance(PaginatedQueryParamsDTO, {
      page: '1',
      limit: '10',
      sortOrder: 'INVALID',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const sortError = errors.find((e) => e.property === 'sortOrder');
    expect(sortError).toBeDefined();
  });

  it('should accept valid sortOrder ASC/DESC', async () => {
    const dtoAsc = plainToInstance(PaginatedQueryParamsDTO, {
      page: '1',
      limit: '10',
      sortOrder: 'ASC',
    });
    const dtoDesc = plainToInstance(PaginatedQueryParamsDTO, {
      page: '1',
      limit: '10',
      sortOrder: 'DESC',
    });

    expect((await validate(dtoAsc)).length).toBe(0);
    expect((await validate(dtoDesc)).length).toBe(0);
    expect(dtoAsc.sortOrder).toBe(SortOrder.ASC);
    expect(dtoDesc.sortOrder).toBe(SortOrder.DESC);
  });

  it('should transform string page/limit to number via @Transform', () => {
    const dto = plainToInstance(PaginatedQueryParamsDTO, {
      page: '5',
      limit: '25',
    });
    expect(dto.page).toBe(5);
    expect(typeof dto.page).toBe('number');
    expect(dto.limit).toBe(25);
    expect(typeof dto.limit).toBe('number');
  });

  it('should allow optional sortBy and sortOrder', async () => {
    const dto = plainToInstance(PaginatedQueryParamsDTO, {
      page: '1',
      limit: '10',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.sortBy).toBeUndefined();
    expect(dto.sortOrder).toBeUndefined();
  });
});

describe('SearchableQueryParamsDTO', () => {
  it('should accept search as optional field', async () => {
    const dto = plainToInstance(SearchableQueryParamsDTO, {
      page: '1',
      limit: '10',
      search: 'João',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.search).toBe('João');
    expect(dto.page).toBe(1);
  });

  it('should validate without search field', async () => {
    const dto = plainToInstance(SearchableQueryParamsDTO, {
      page: '1',
      limit: '10',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.search).toBeUndefined();
  });

  it('should inherit page/limit validation from parent', async () => {
    const dto = plainToInstance(SearchableQueryParamsDTO, {
      page: '0',
      limit: '10',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('PaginatedQueryResultDTO', () => {
  it('should be instantiable with typed data', () => {
    type TicketDTO = { id: string; protocol: string };

    const result = new PaginatedQueryResultDTO<TicketDTO>();
    result.data = [{ id: '1', protocol: 'ABC' }];
    result.page = 1;
    result.limit = 10;
    result.total = 150;
    result.totalPages = 15;

    expect(result.data).toHaveLength(1);
    expect(result.data[0].protocol).toBe('ABC');
    expect(result.page).toBe(1);
    expect(result.total).toBe(150);
    expect(result.totalPages).toBe(15);
  });

  it('should support array data of any type', () => {
    const result = new PaginatedQueryResultDTO<number>();
    result.data = [1, 2, 3];
    result.page = 1;
    result.limit = 3;
    result.total = 3;
    result.totalPages = 1;

    expect(result.data).toEqual([1, 2, 3]);
  });
});
