# Project Development Guidelines

## General Work Principles

### Task Execution Process
1. **Planning**: Always create a detailed action plan before starting work
2. **Implementation**: Execute the task according to the plan, following project standards
3. **Review**: After completing work, verify:
   - Code works correctly
   - No syntax errors
   - Coding standards are followed
   - All files are saved
4. **Report**: Provide a brief report on completed work
5. **Commit**: If everything is OK, make a commit and push to GitHub

### Working with Git
- **Commit message format**: 
  - `feat: description` - new functionality
  - `fix: description` - bug fix
  - `refactor: description` - code refactoring
  - `docs: description` - documentation changes
  - `style: description` - formatting, style
  - `test: description` - adding/changing tests

- **Before committing**:
  - Ensure code works
  - Check for errors
  - Remove unnecessary comments and debug code

## Coding Standards

### JavaScript/TypeScript
- Use `const` and `let`, avoid `var`
- Prefer arrow functions for callbacks
- Use async/await instead of promise chains
- Always handle errors (try/catch)
- Naming conventions:
  - camelCase for variables and functions
  - PascalCase for classes and components
  - UPPER_CASE for constants

### Python
- Follow PEP 8
- Use type hints where possible
- Document functions and classes with docstrings
- Naming conventions:
  - snake_case for variables and functions
  - PascalCase for classes
  - UPPER_CASE for constants

### HTML/CSS
- Semantic markup
- BEM notation for CSS classes (where applicable)
- Mobile-first approach
- Accessibility (ARIA attributes, alt for images)

## Architectural Principles

### Code Organization
- **Modularity**: Separate code into logical modules/components
- **DRY** (Don't Repeat Yourself): Avoid code duplication
- **KISS** (Keep It Simple, Stupid): Prefer simple solutions
- **Separation of Concerns**: Separate responsibilities between modules

### Project Structure
- Logical folder hierarchy
- Group related files
- Separate folders for:
  - `/src` - source code
  - `/components` - components
  - `/utils` - utilities
  - `/tests` - tests
  - `/docs` - documentation

## Documentation

### Code Comments
- Explain **why**, not **what** the code does
- Document complex logic
- Avoid obvious comments
- Keep comments up to date

### README and Documentation
- Project description and purpose
- Installation and launch instructions
- Usage examples
- Description of main functions/API

## Code Quality

### Testing
- Write tests for critical functionality
- Check edge cases
- Keep tests up to date

### Performance
- Avoid premature optimization
- Profile before optimizing
- Pay attention to algorithm complexity

### Security
- Validate user input
- Don't store sensitive data in code
- Use secure methods (prepared statements for SQL, etc.)

## Communication

### Work Reports
After completing a task, provide:
- What was done
- Which files were changed/added
- Problems encountered and their solutions
- Next steps (if any)

### Questions and Clarifications
- Ask clarifying questions when requirements are unclear
- Suggest alternative solutions if you see a better approach
- Report potential problems in advance

## Pre-Completion Checklist

- [ ] Execution plan created
- [ ] Code written and tested
- [ ] No errors or warnings
- [ ] Code meets project standards
- [ ] Necessary documentation added
- [ ] Files saved
- [ ] Work report compiled
- [ ] Commit message is meaningful
- [ ] Push to GitHub completed
