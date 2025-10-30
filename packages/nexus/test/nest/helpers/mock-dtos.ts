import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class MockSuccessDto {
    @Expose()
    @IsInt()
    id!: number;

    @Expose()
    @IsString()
    @IsNotEmpty()
    name!: string;
}

export class MockValidationErrorDto {
    @Expose()
    @IsString()
    code = 'VALIDATION_ERROR';

    @Expose()
    @IsString({ each: true })
    fields!: string[];
}

export class MockNotFoundErrorDto {
    @Expose()
    @IsString()
    message!: string;
}

export class MockBodyDto {
    @Expose()
    @IsString()
    @IsNotEmpty()
    description!: string;

    @Expose()
    @IsInt()
    @Min(0)
    value!: number;
}