import type { FastifyRequest, FastifyReply } from 'fastify';
import { validateCsvFileMiddleware } from '@/modules/subscriptions/infrastucture/http/middlewares/validate-csv-file.middleware';
import { BadRequestError } from '@/shared/infrastructure/http/errors';

// Mock csv-parse
jest.mock('csv-parse/sync', () => ({
  parse: jest.fn(),
}));

const { parse } = require('csv-parse/sync');

describe('validateCsvFileMiddleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockFile: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFile = {
      mimetype: 'text/csv',
      filename: 'subscriptions.csv',
      toBuffer: jest.fn(),
    };

    mockRequest = {
      file: jest.fn().mockResolvedValue(mockFile),
    } as any;

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;
  });

  describe('when file is missing', () => {
    it('should throw BadRequestError', async () => {
      (mockRequest.file as jest.Mock).mockResolvedValue(null);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('CSV file is required');
    });
  });

  describe('when file type is invalid', () => {
    it('should throw BadRequestError for non-CSV files', async () => {
      mockFile.mimetype = 'application/json';
      mockFile.toBuffer.mockResolvedValue(Buffer.from('test'));

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('File must be a CSV file');
    });

    it('should accept CSV mimetype', async () => {
      mockFile.mimetype = 'text/csv';
      mockFile.toBuffer.mockResolvedValue(
        Buffer.from('name,price,billingCycle,startDate\nNetflix,29.90,MONTHLY,2024-01-01')
      );
      parse.mockReturnValue([
        { name: 'Netflix', price: '29.90', billingCycle: 'MONTHLY', startDate: '2024-01-01' },
      ]);

      await validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.csvData).toBeDefined();
    });

    it('should accept text/plain mimetype', async () => {
      mockFile.mimetype = 'text/plain';
      mockFile.toBuffer.mockResolvedValue(
        Buffer.from('name,price,billingCycle,startDate\nNetflix,29.90,MONTHLY,2024-01-01')
      );
      parse.mockReturnValue([
        { name: 'Netflix', price: '29.90', billingCycle: 'MONTHLY', startDate: '2024-01-01' },
      ]);

      await validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.csvData).toBeDefined();
    });
  });

  describe('when file buffer read fails', () => {
    it('should throw BadRequestError', async () => {
      mockFile.toBuffer.mockRejectedValue(new Error('Buffer read failed'));

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Failed to read file');
    });
  });

  describe('when CSV file is empty', () => {
    it('should throw BadRequestError for empty content', async () => {
      mockFile.toBuffer.mockResolvedValue(Buffer.from(''));

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('CSV file is empty');
    });

    it('should throw BadRequestError for whitespace-only content', async () => {
      mockFile.toBuffer.mockResolvedValue(Buffer.from('   \n\t  '));

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('CSV file is empty');
    });
  });

  describe('when CSV parsing fails', () => {
    it('should throw BadRequestError with error details', async () => {
      mockFile.toBuffer.mockResolvedValue(Buffer.from('invalid,csv'));
      parse.mockImplementation(() => {
        throw new Error('Invalid CSV format');
      });

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Invalid CSV format');
    });
  });

  describe('when CSV has no data rows', () => {
    it('should throw BadRequestError', async () => {
      mockFile.toBuffer.mockResolvedValue(Buffer.from('name,price\n'));
      parse.mockReturnValue([]);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('CSV file contains no data rows');
    });
  });

  describe('when CSV is valid', () => {
    it('should parse CSV and attach transformed data to request', async () => {
      const csvContent = 'name,price,billingCycle,startDate\nNetflix,29.90,MONTHLY,2024-01-01';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: 'Netflix',
          price: '29.90',
          billingCycle: 'MONTHLY',
          startDate: '2024-01-01',
        },
      ]);

      await validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.csvData).toBeDefined();
      expect(mockRequest.csvData?.subscriptions).toHaveLength(1);
      expect(mockRequest.csvData?.subscriptions[0]).toMatchObject({
        name: 'Netflix',
        price: 29.9,
        currency: 'BRL', // default applied by Zod
        billingCycle: 'MONTHLY',
      });
      expect(mockRequest.csvData?.subscriptions[0].startDate).toBeInstanceOf(Date);
      expect(mockRequest.csvData?.subscriptions[0].startDate.getTime()).toBe(
        new Date('2024-01-01').getTime()
      );
    });

    it('should handle multiple rows', async () => {
      const csvContent =
        'name,price,billingCycle,startDate\nNetflix,29.90,MONTHLY,2024-01-01\nSpotify,19.90,MONTHLY,2024-01-15';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: 'Netflix',
          price: '29.90',
          billingCycle: 'MONTHLY',
          startDate: '2024-01-01',
        },
        {
          name: 'Spotify',
          price: '19.90',
          billingCycle: 'MONTHLY',
          startDate: '2024-01-15',
        },
      ]);

      await validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.csvData?.subscriptions).toHaveLength(2);
      expect(mockRequest.csvData?.subscriptions[0].price).toBe(29.9);
      expect(mockRequest.csvData?.subscriptions[1].price).toBe(19.9);
    });

    it('should handle optional fields', async () => {
      const csvContent =
        'name,price,currency,billingCycle,startDate,trialEndsAt\nNetflix,29.90,BRL,MONTHLY,2024-01-01,2024-01-31';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: 'Netflix',
          price: '29.90',
          currency: 'BRL',
          billingCycle: 'MONTHLY',
          startDate: '2024-01-01',
          trialEndsAt: '2024-01-31',
        },
      ]);

      await validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.csvData?.subscriptions[0].currency).toBe('BRL');
      expect(mockRequest.csvData?.subscriptions[0].trialEndsAt).toBeInstanceOf(Date);
      expect(mockRequest.csvData?.subscriptions[0].trialEndsAt?.getTime()).toBe(
        new Date('2024-01-31').getTime()
      );
    });

    it('should use default currency BRL when not provided', async () => {
      const csvContent = 'name,price,billingCycle,startDate\nNetflix,29.90,MONTHLY,2024-01-01';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: 'Netflix',
          price: '29.90',
          billingCycle: 'MONTHLY',
          startDate: '2024-01-01',
        },
      ]);

      await validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Zod applies the default 'BRL' when currency is not provided
      expect(mockRequest.csvData?.subscriptions[0].currency).toBe('BRL');
    });

    it('should handle USD currency', async () => {
      const csvContent =
        'name,price,currency,billingCycle,startDate\nNetflix,9.99,USD,MONTHLY,2024-01-01';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: 'Netflix',
          price: '9.99',
          currency: 'USD',
          billingCycle: 'MONTHLY',
          startDate: '2024-01-01',
        },
      ]);

      await validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.csvData?.subscriptions[0].currency).toBe('USD');
    });
  });

  describe('when CSV validation fails', () => {
    it('should throw BadRequestError for missing name', async () => {
      const csvContent = 'name,price,billingCycle,startDate\n,29.90,MONTHLY,2024-01-01';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: '',
          price: '29.90',
          billingCycle: 'MONTHLY',
          startDate: '2024-01-01',
        },
      ]);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Invalid CSV format');
    });

    it('should throw BadRequestError for invalid price', async () => {
      const csvContent = 'name,price,billingCycle,startDate\nNetflix,-10,MONTHLY,2024-01-01';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: 'Netflix',
          price: '-10',
          billingCycle: 'MONTHLY',
          startDate: '2024-01-01',
        },
      ]);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Invalid CSV format');
    });

    it('should throw BadRequestError for invalid billing cycle', async () => {
      const csvContent = 'name,price,billingCycle,startDate\nNetflix,29.90,DAILY,2024-01-01';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: 'Netflix',
          price: '29.90',
          billingCycle: 'DAILY',
          startDate: '2024-01-01',
        },
      ]);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Invalid CSV format');
    });

    it('should throw BadRequestError for invalid currency', async () => {
      const csvContent =
        'name,price,currency,billingCycle,startDate\nNetflix,29.90,EUR,MONTHLY,2024-01-01';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: 'Netflix',
          price: '29.90',
          currency: 'EUR',
          billingCycle: 'MONTHLY',
          startDate: '2024-01-01',
        },
      ]);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Invalid CSV format');
    });

    it('should throw BadRequestError for invalid date format', async () => {
      const csvContent = 'name,price,billingCycle,startDate\nNetflix,29.90,MONTHLY,invalid-date';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: 'Netflix',
          price: '29.90',
          billingCycle: 'MONTHLY',
          startDate: 'invalid-date',
        },
      ]);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Invalid CSV format');
    });

    it('should throw BadRequestError for zero price', async () => {
      const csvContent = 'name,price,billingCycle,startDate\nNetflix,0,MONTHLY,2024-01-01';
      mockFile.toBuffer.mockResolvedValue(Buffer.from(csvContent));
      parse.mockReturnValue([
        {
          name: 'Netflix',
          price: '0',
          billingCycle: 'MONTHLY',
          startDate: '2024-01-01',
        },
      ]);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(BadRequestError);

      await expect(
        validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Invalid CSV format');
    });
  });

  describe('when mimetype is missing', () => {
    it('should still process the file', async () => {
      mockFile.mimetype = undefined;
      mockFile.toBuffer.mockResolvedValue(
        Buffer.from('name,price,billingCycle,startDate\nNetflix,29.90,MONTHLY,2024-01-01')
      );
      parse.mockReturnValue([
        { name: 'Netflix', price: '29.90', billingCycle: 'MONTHLY', startDate: '2024-01-01' },
      ]);

      await validateCsvFileMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.csvData).toBeDefined();
    });
  });
});
