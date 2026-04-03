import { ApiProperty } from '@nestjs/swagger';

class ResponseDataBuilder<T = unknown> {
  private readonly responseData: ResponseData<T>;

  constructor() {
    this.responseData = new ResponseData<T>();
    this.responseData.successful = true;
  }

  successful(): this {
    this.responseData.successful = true;
    return this;
  }

  unsuccessful(): this {
    this.responseData.successful = false;
    return this;
  }

  withErrorMessage(errorMessage: string): this {
    this.responseData.errorMessage = errorMessage;
    return this;
  }

  withDetailedErrorMessage(detailedErrorMessage: string): this {
    this.responseData.detailedErrorMessage = detailedErrorMessage;
    return this;
  }

  withData(data: T): this {
    this.responseData.data = data;
    return this;
  }

  build(): ResponseData<T> {
    return this.responseData;
  }
}

export class ResponseData<T = unknown> {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    type: Boolean,
    example: true,
  })
  successful!: boolean;

  @ApiProperty({
    description: 'Mensagem de erro (quando successful é false)',
    type: String,
    example: 'Ocorreu um erro ao processar a solicitação.',
    required: false,
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'Mensagem detalhada de erro (quando successful é false)',
    type: String,
    example: 'O campo X é obrigatório e não foi fornecido.',
    required: false,
  })
  detailedErrorMessage?: string;

  @ApiProperty({
    description: 'Dados retornados pela operação',
    type: Object,
    required: false,
  })
  data?: T;

  static builder<T = unknown>(): ResponseDataBuilder<T> {
    return new ResponseDataBuilder<T>();
  }
}
