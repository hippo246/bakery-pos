# Update Tracker - Agent Usage Guide

## Overview
The Update Tracker is a mandatory system for tracking all changes made to the Bakery POS project. Every agent (human or AI) that works on this project MUST update the tracker after making changes.

## Location
Access the Update Tracker via:
- Settings → Project → Update Tracker

## Required Information for Each Update

When making changes to the project, you MUST add an entry with:

### 1. Type (Required)
Choose one:
- **feature** - New functionality added
- **bugfix** - Bug fixed
- **improvement** - Enhancement to existing functionality
- **refactor** - Code restructuring without behavior change
- **documentation** - Documentation updates

### 2. Category (Required)
Choose one:
- **general** - General changes
- **ui** - UI/UX changes
- **backend** - Backend logic
- **database** - Database-related changes
- **api** - API changes
- **integration** - Third-party integrations
- **performance** - Performance optimizations
- **security** - Security fixes
- **testing** - Test additions
- **documentation** - Documentation changes

### 3. Description (Required)
Clear, concise description of what was changed.

### 4. Agent Name (Required)
Your name or identifier (e.g., "Devin", "Claude", "Human", "John")

### 5. Files Modified (Optional)
Comma-separated list of files that were modified.

## Example Entries

### Feature Addition
```
Type: feature
Category: integration
Agent: Devin
Files Modified: src/services/OrderService.js, src/components/Orders.jsx
Description: Added real-time order synchronization across all tabs
```

### Bug Fix
```
Type: bugfix
Category: ui
Agent: Human
Files Modified: src/components/Tables.jsx
Description: Fixed table status not updating when order is paid
```

### Refactor
```
Type: refactor
Category: backend
Agent: Claude
Files Modified: src/services/OrderService.js
Description: Refactored order processing logic for better performance
```

## Version System
- Version starts at 0
- Each update increments the version by 1
- Version is automatically incremented when you add an update

## Mandatory Policy
**STRICT REQUIREMENT**: Any agent working on this project MUST update the Update Tracker before completing their task. This includes:
- Human developers
- AI agents (Devin, Claude, etc.)
- Any automated systems

Failure to update the tracker is a violation of project standards.

## How to Access Programmatically
The tracker data is stored in localStorage under key: `bakerypos_update_tracker`

```javascript
// Read tracker
const tracker = JSON.parse(localStorage.getItem('bakerypos_update_tracker'));

// Add update programmatically
const newUpdate = {
  version: tracker.currentVersion + 1,
  type: 'feature',
  category: 'general',
  description: 'Your change description',
  agent: 'Your Name',
  filesModified: ['file1.js', 'file2.js'],
  timestamp: new Date().toISOString()
};

tracker.currentVersion += 1;
tracker.updates.unshift(newUpdate);
tracker.lastUpdated = new Date().toISOString();

localStorage.setItem('bakerypos_update_tracker', JSON.stringify(tracker));
```

## Statistics
The tracker provides:
- Total number of updates
- Feature count
- Bug fix count
- Improvement count
- Refactor count
- Documentation count
- Project start date
- Last update date

## Best Practices
1. **Be Specific**: Use clear, descriptive language
2. **Include Context**: Explain why the change was made
3. **List Files**: Include all files that were modified
4. **Use Proper Categories**: Choose the most relevant category
5. **Update Immediately**: Add tracker entry right after making changes
6. **Be Honest**: Accurately reflect what was actually done

## Consequences of Non-Compliance
Failure to update the tracker will be considered:
- A violation of project standards
- Unprofessional conduct
- Potential blocking of future contributions

## Support
If you have questions about the Update Tracker, refer to the Settings → Project → Update Tracker section in the application.