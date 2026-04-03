import {
  AnyBulkWriteOperation,
  ClientSession,
  Document,
  FilterQuery,
  Model,
  MongooseUpdateQueryOptions,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { BulkWriteResult, ObjectId } from 'mongodb';

export abstract class BaseRepository<TDocument, TId = string> {
  protected constructor(protected readonly model: Model<TDocument>) {}

  create(partial: Partial<TDocument>): Promise<TDocument> {
    return this.model.create(partial);
  }

  async createWithSession(
    partial: Partial<TDocument>,
    session: ClientSession,
  ): Promise<TDocument> {
    const createdModels = await this.model.create([partial], { session });
    return createdModels[0];
  }

  findById(id: TId): Promise<TDocument | null> {
    return this.model.findById(id).exec();
  }

  findOne(query: FilterQuery<TDocument>): Promise<TDocument | null> {
    return this.model.findOne(query).exec();
  }

  find(
    query: FilterQuery<TDocument>,
    options?: QueryOptions,
  ): Promise<TDocument[]> {
    return this.model.find(query, null, options).exec();
  }

  update(id: TId, partial: Partial<TDocument>): Promise<TDocument | null> {
    return this.model.findByIdAndUpdate(id, partial, {
      new: true,
      runValidators: true,
    });
  }

  updateMany(
    query: FilterQuery<TDocument>,
    data: UpdateQuery<TDocument>,
    options?: MongooseUpdateQueryOptions,
  ): Promise<{
    acknowledged: boolean;
    matchedCount: number;
    modifiedCount: number;
  }> {
    return this.model.updateMany(query, data, options).exec();
  }

  updateOne(
    query: FilterQuery<TDocument>,
    data: UpdateQuery<TDocument>,
    options?: MongooseUpdateQueryOptions,
  ): Promise<{
    acknowledged: boolean;
    matchedCount: number;
    modifiedCount: number;
    upsertedCount: number;
    upsertedId: ObjectId | null;
  }> {
    return this.model.updateOne(query, data, options).exec();
  }

  findOneAndUpdate(
    query: FilterQuery<TDocument>,
    data: UpdateQuery<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<TDocument | null> {
    return this.model.findOneAndUpdate(query, data, options).exec();
  }

  bulkWrite(
    operations: AnyBulkWriteOperation<
      TDocument extends Document
        ? any
        : TDocument extends object
          ? TDocument
          : any
    >[],
  ): Promise<BulkWriteResult> {
    return this.model.bulkWrite(operations);
  }

  delete(id: TId): Promise<TDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  countDocuments(query: FilterQuery<TDocument>): Promise<number> {
    return this.model.countDocuments(query).exec();
  }
}
