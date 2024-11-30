import 'reflect-metadata';

// Mock class-validator decorators
jest.mock('class-validator', () => ({
  IsNotEmpty: () => jest.fn(),
  Length: () => jest.fn(),
  IsEmail: () => jest.fn(),
  MinLength: () => jest.fn(),
  MaxLength: () => jest.fn(),
  IsEnum: () => jest.fn(),
  Matches: () => jest.fn(),
  IsUrl: () => jest.fn(),
  IsDate: () => jest.fn(),
  IsInt: () => jest.fn(),
  Min: () => jest.fn(),
  IsNumber: () => jest.fn(),
  Max: () => jest.fn(),
  IsArray: () => jest.fn(),
  ArrayMinSize: () => jest.fn(),
  ArrayMaxSize: () => jest.fn(),
  ArrayNotEmpty: () => jest.fn(),
  IsOptional: () => jest.fn(),
  validate: jest.fn().mockResolvedValue([]),
}));

// Global test setup
beforeAll(() => {
  // Add any additional setup if needed
});

afterAll(() => {
  // Add any cleanup if needed
});
