import { Model, ClientSession } from 'mongoose';
import { BaseRepository } from '../../src/repository/base.repository';

interface TestDocument {
  _id: string;
  name: string;
  email: string;
}

class TestRepository extends BaseRepository<TestDocument> {
  constructor(model: Model<TestDocument>) {
    super(model);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockModel: Record<string, any>;

  const mockExec = (returnValue: any) => ({
    exec: jest.fn().mockResolvedValue(returnValue),
  });

  beforeEach(() => {
    mockModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateMany: jest.fn(),
      updateOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      bulkWrite: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };

    repository = new TestRepository(
      mockModel as unknown as Model<TestDocument>,
    );
  });

  describe('create', () => {
    it('should call model.create with partial data', async () => {
      const partial = { name: 'João', email: 'joao@test.com' };
      const created = { _id: '1', ...partial };
      mockModel.create.mockResolvedValue(created);

      const result = await repository.create(partial);

      expect(mockModel.create).toHaveBeenCalledWith(partial);
      expect(result).toEqual(created);
    });
  });

  describe('createWithSession', () => {
    it('should call model.create with array and session option', async () => {
      const partial = { name: 'Maria' };
      const created = { _id: '2', ...partial };
      const session = {} as ClientSession;
      mockModel.create.mockResolvedValue([created]);

      const result = await repository.createWithSession(partial, session);

      expect(mockModel.create).toHaveBeenCalledWith([partial], { session });
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('should call model.findById(id).exec()', async () => {
      const doc = { _id: '1', name: 'João', email: 'joao@test.com' };
      mockModel.findById.mockReturnValue(mockExec(doc));

      const result = await repository.findById('1');

      expect(mockModel.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(doc);
    });
  });

  describe('findOne', () => {
    it('should call model.findOne(query).exec()', async () => {
      const query = { email: 'joao@test.com' };
      const doc = { _id: '1', name: 'João', email: 'joao@test.com' };
      mockModel.findOne.mockReturnValue(mockExec(doc));

      const result = await repository.findOne(query);

      expect(mockModel.findOne).toHaveBeenCalledWith(query);
      expect(result).toEqual(doc);
    });
  });

  describe('find', () => {
    it('should call model.find(query, null, options).exec()', async () => {
      const query = { name: 'João' };
      const options = { limit: 10 };
      const docs = [{ _id: '1', name: 'João', email: 'joao@test.com' }];
      mockModel.find.mockReturnValue(mockExec(docs));

      const result = await repository.find(query, options);

      expect(mockModel.find).toHaveBeenCalledWith(query, null, options);
      expect(result).toEqual(docs);
    });
  });

  describe('update', () => {
    it('should call model.findByIdAndUpdate with new:true and runValidators:true', async () => {
      const partial = { name: 'João Updated' };
      const updated = { _id: '1', ...partial, email: 'joao@test.com' };
      mockModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await repository.update('1', partial);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('1', partial, {
        new: true,
        runValidators: true,
      });
      expect(result).toEqual(updated);
    });
  });

  describe('updateMany', () => {
    it('should call model.updateMany(query, data, options).exec()', async () => {
      const query = { name: 'Old' };
      const data = { $set: { name: 'New' } };
      const response = {
        acknowledged: true,
        matchedCount: 5,
        modifiedCount: 3,
      };
      mockModel.updateMany.mockReturnValue(mockExec(response));

      const result = await repository.updateMany(query, data);

      expect(mockModel.updateMany).toHaveBeenCalledWith(query, data, undefined);
      expect(result).toEqual(response);
    });
  });

  describe('updateOne', () => {
    it('should call model.updateOne(query, data, options).exec()', async () => {
      const query = { _id: '1' };
      const data = { $set: { name: 'Updated' } };
      const response = {
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedCount: 0,
        upsertedId: null,
      };
      mockModel.updateOne.mockReturnValue(mockExec(response));

      const result = await repository.updateOne(query, data);

      expect(mockModel.updateOne).toHaveBeenCalledWith(query, data, undefined);
      expect(result).toEqual(response);
    });
  });

  describe('findOneAndUpdate', () => {
    it('should call model.findOneAndUpdate(query, data, options).exec()', async () => {
      const query = { email: 'joao@test.com' };
      const data = { $set: { name: 'João V2' } };
      const updated = { _id: '1', name: 'João V2', email: 'joao@test.com' };
      mockModel.findOneAndUpdate.mockReturnValue(mockExec(updated));

      const result = await repository.findOneAndUpdate(query, data);

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        query,
        data,
        undefined,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('bulkWrite', () => {
    it('should call model.bulkWrite with operations', async () => {
      const operations = [
        { insertOne: { document: { name: 'Bulk1' } } },
      ] as any;
      const bulkResult = { insertedCount: 1 };
      mockModel.bulkWrite.mockResolvedValue(bulkResult);

      const result = await repository.bulkWrite(operations);

      expect(mockModel.bulkWrite).toHaveBeenCalledWith(operations);
      expect(result).toEqual(bulkResult);
    });
  });

  describe('delete', () => {
    it('should call model.findByIdAndDelete(id).exec()', async () => {
      const doc = { _id: '1', name: 'João', email: 'joao@test.com' };
      mockModel.findByIdAndDelete.mockReturnValue(mockExec(doc));

      const result = await repository.delete('1');

      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('1');
      expect(result).toEqual(doc);
    });
  });

  describe('countDocuments', () => {
    it('should call model.countDocuments(query).exec()', async () => {
      const query = { name: 'João' };
      mockModel.countDocuments.mockReturnValue(mockExec(42));

      const result = await repository.countDocuments(query);

      expect(mockModel.countDocuments).toHaveBeenCalledWith(query);
      expect(result).toBe(42);
    });
  });
});
