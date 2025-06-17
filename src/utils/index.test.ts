import { kebabCase, camelCase, pascalCase, startCase } from '../utils';

describe('String utilities', () => {
  describe('kebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(kebabCase('camelCase')).toBe('camel-case');
    });

    it('should convert PascalCase to kebab-case', () => {
      expect(kebabCase('PascalCase')).toBe('pascal-case');
    });

    it('should handle spaces', () => {
      expect(kebabCase('hello world')).toBe('hello-world');
    });

    it('should handle underscores', () => {
      expect(kebabCase('hello_world')).toBe('hello-world');
    });
  });

  describe('camelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(camelCase('kebab-case')).toBe('kebabCase');
    });

    it('should handle spaces', () => {
      expect(camelCase('hello world')).toBe('helloWorld');
    });

    it('should handle underscores', () => {
      expect(camelCase('hello_world')).toBe('helloWorld');
    });
  });

  describe('pascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(pascalCase('kebab-case')).toBe('KebabCase');
    });

    it('should handle camelCase input', () => {
      expect(pascalCase('camelCase')).toBe('CamelCase');
    });
  });

  describe('startCase', () => {
    it('should convert camelCase to Start Case', () => {
      expect(startCase('camelCase')).toBe('Camel Case');
    });

    it('should convert kebab-case to Start Case', () => {
      expect(startCase('kebab-case')).toBe('Kebab Case');
    });
  });
});

