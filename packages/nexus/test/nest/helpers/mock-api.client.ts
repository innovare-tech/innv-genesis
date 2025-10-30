import 'reflect-metadata';
import {
    ApiClient,
    Get,
    Post,
    Path,
    Query,
    Body,
    Header,
    ErrorResponse,
    Result,
} from '../../../src';
import {
    MockSuccessDto,
    MockValidationErrorDto,
    MockNotFoundErrorDto,
    MockBodyDto,
} from './mock-dtos';

@ApiClient({
    baseUrl: 'http://hardcoded.com/api',
    timeout: 1000,
    staticHeaders: { 'X-Static': 'StaticValue' },
})
export abstract class MockHardcodedApiClient {
    @Get('/items/:id')
    @ErrorResponse(404, MockNotFoundErrorDto)
    getItem(
        @Path('id') _id: number,
        @Query('details') _details?: boolean,
        @Header('X-Tenant-Id') _tenantId?: string,
    ): Promise<Result<MockSuccessDto, MockNotFoundErrorDto>> {
        throw new Error('Not implemented');
    }

    @Post('/items')
    @ErrorResponse(400, MockValidationErrorDto)
    createItem(
        @Body() _body: MockBodyDto,
    ): Promise<Result<MockSuccessDto, MockValidationErrorDto>> {
        throw new Error('Not implemented');
    }

    @Get('/ping')
    ping(): Promise<Result<{ message: string }, never>> {
        throw new Error('Not implemented');
    }
}

@ApiClient({
    baseUrlEnvKey: 'TEST_API_URL',
    timeoutEnvKey: 'TEST_API_TIMEOUT',
})
export abstract class MockEnvApiClient {
    @Get('/status')
    getStatus(): Promise<Result<{ status: string }, never>> {
        throw new Error('Not implemented');
    }
}