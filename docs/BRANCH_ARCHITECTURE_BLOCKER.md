# Branch Architecture Blocker

**Status:** BLOCKER - Requires Broader Architectural Work  
**Date:** 2026-08-13

## Current State

Repository implementations currently support tenant and business scoping:
- `tenantId` filtering is implemented in all LocalStorage repository providers
- `businessId` filtering is implemented in all LocalStorage repository providers
- **`branchId` filtering is NOT implemented**

## Gap Analysis

### Missing Branch Context

1. **Repository Interfaces**: No `branchId` parameter in repository constructors or query options
2. **LocalStorage Implementations**: No branchId filtering logic in `_load*` methods
3. **Data Models**: Most entities do not carry `branchId` field
4. **Context**: AppContext does not expose branchId to repositories

### Required Changes

To implement branch isolation through repository abstraction, the following would be required:

1. **Update All Repository Interfaces** (15+ repositories):
   - Add `branchId` to constructor options
   - Add `branchId` to QueryOptions
   - Add `findByBranchId()` methods

2. **Update All LocalStorage Implementations** (15+ implementations):
   - Add branchId filtering in `_load*` methods
   - Update storage keys to include branchId (optional)
   - Add branchId to entity normalization

3. **Update Data Models** (15+ domain models):
   - Add `branchId` field to all entity schemas
   - Update normalization functions
   - Update seed data generation

4. **Update AppContext**:
   - Add branchId to context state
   - Pass branchId to repository factory
   - Add branchId configuration

5. **Update Components**:
   - Ensure components pass branchId context
   - Update UI to handle branch selection (if multi-branch)

## Recommendation

**Document as Separate Blocker**

Branch isolation is a significant architectural change that affects:
- 15+ repository interfaces
- 15+ repository implementations  
- 15+ data models
- AppContext and all consuming components

This work should be:
1. Tracked as a separate epic/feature
2. Prioritized based on business requirements (multi-branch vs single-branch deployments)
3. Implemented with proper migration strategy for existing data

## Current Mitigation

For single-branch deployments (current assumption):
- Tenant + business scoping provides sufficient isolation
- Branch isolation can be added later when multi-branch support is required
- No production deployment risk for single-branch scenarios

## Next Steps

1. Confirm business requirement for multi-branch support
2. If required, create dedicated epic for branch architecture
3. Design migration strategy for existing data
4. Implement incrementally with backward compatibility

---

**Conclusion:** Branch isolation is architecturally feasible but requires significant work. Document as separate blocker and proceed with remaining phases.
