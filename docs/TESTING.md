# NeuroCanvas Testing Guide

## Overview
This document provides comprehensive testing instructions for the NeuroCanvas AI Art Director project.

## Prerequisites
- Node.js v18+ installed
- Python 3.8+ installed
- MongoDB running
- All dependencies installed (`npm install` in backend directory)

## Running Tests

### 1. Unit Tests
Unit tests verify individual service functions work correctly.

```bash
cd backend
npm test
```

Run specific test suites:
```bash
# Test NLP service only
npm test -- nlpService.test.js

# Test diffusion service only
npm test -- diffusionService.test.js

# Test style transfer service only
npm test -- styleTransferService.test.js
```

### 2. Integration Tests
Integration tests verify API endpoints work correctly.

**Important:** Start the server before running integration tests:

```bash
# Terminal 1: Start the server
cd backend
npm start

# Terminal 2: Run integration tests
npm test -- api.test.js
```

### 3. Coverage Report
Generate test coverage report:

```bash
npm test -- --coverage
```

This will create a coverage report in `backend/coverage/` directory.

## Test Structure

```
backend/tests/
├── unit/                    # Unit tests
│   ├── nlpService.test.js
│   ├── diffusionService.test.js
│   └── styleTransferService.test.js
└── integration/             # Integration tests
    └── api.test.js
```

## Writing New Tests

### Unit Test Example
```javascript
describe('Service Name', () => {
  test('should do something', async () => {
    const result = await serviceFunction(params);
    expect(result).toBeDefined();
    expect(result.property).toBe(expectedValue);
  });
});
```

### Integration Test Example
```javascript
describe('API Endpoint', () => {
  test('POST /api/endpoint should return 200', async () => {
    const response = await request(BASE_URL)
      .post('/api/endpoint')
      .send({ data: 'test' })
      .expect(200);
    
    expect(response.body).toBeDefined();
  });
});
```

## Test Configuration

Jest configuration in `package.json`:
```json
{
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"],
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

## Troubleshooting

### Tests Timeout
If tests timeout, increase the timeout:
```javascript
test('long running test', async () => {
  // test code
}, 120000); // 2 minutes
```

### Python Script Errors
Ensure Python environment is activated:
```bash
source venv/bin/activate  # On macOS/Linux
venv\Scripts\activate     # On Windows
```

### Port Already in Use
If port 5000 is in use, change it in `.env`:
```
PORT=5001
```

## CI/CD Integration

Tests can be run in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run tests
  run: |
    cd backend
    npm install
    npm test
```

## Best Practices

1. **Keep tests isolated** - Each test should be independent
2. **Use descriptive names** - Test names should clearly describe what they test
3. **Clean up after tests** - Remove generated files/data
4. **Mock external dependencies** - Don't rely on external services
5. **Test edge cases** - Include tests for error conditions
6. **Maintain test coverage** - Aim for 80%+ coverage

## Next Steps

- Add E2E tests with Playwright
- Add load testing with Artillery
- Set up continuous testing in CI/CD
- Add visual regression testing
