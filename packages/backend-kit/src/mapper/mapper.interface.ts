export interface IMapper<TInput, TOutput> {
  map(input: TInput): TOutput;
}

export interface IAsyncMapper<TInput, TOutput> {
  map(input: TInput): Promise<TOutput>;
}
