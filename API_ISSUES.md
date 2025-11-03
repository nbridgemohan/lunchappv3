# Common API Issues to Avoid

## Issue 1: Missing Model Imports for `.populate()`
**Problem:** When using `.populate()` to reference another model, the referenced model must be imported in the route file.

**Error:** `Schema hasn't been registered for model "ModelName". Use mongoose.model(name, schema)`

**Solution:** Always import any model you're using with `.populate()`:
```javascript
import User from '@/models/User';
import LunchLocation from '@/models/LunchLocation';
import LunchOrder from '@/models/LunchOrder';
```

**Affected Routes:**
- Any route that calls `.populate('fieldName')`
- All lunch-locations routes (populate User for createdBy)
- All lunch-orders routes (populate User and LunchLocation)

---

## Issue 2: JWT Token Field Names Must Match Usage
**Problem:** The JWT token is created with specific field names in the login endpoint, but API routes were trying to access different field names.

**Error:** `createdBy: Path 'createdBy' is required` (when createdBy is actually undefined)

**Solution:** Token created with: `{ userId, username }`
- Always use `user.userId` (NOT `user._id`) when accessing decoded JWT
- Always use `user.username` when accessing username from token

**Affected Routes:**
- `POST /api/lunch-locations` - Use `user.userId` for `createdBy`
- `PUT/DELETE /api/lunch-locations/[id]` - Use `user.userId` for auth checks
- `POST /api/lunch-locations/[id]/vote` - Use `user.userId` for voting logic
- `POST /api/lunch-orders` - Use `user.userId` for order creator
- `PUT/DELETE /api/lunch-orders/[id]` - Use `user.userId` for auth checks

---

## Issue 3: authenticateRequest Returns Object with Properties
**Problem:** The `authenticateRequest()` function returns `{ authenticated, user, response }` but routes were destructuring only `user`.

**Error:** `user is undefined` when trying to access `user.userId`

**Solution:** Always destructure all three properties and check authentication:
```javascript
const { authenticated, user, response } = await authenticateRequest(request);
if (!authenticated) {
  return response; // Return 401 error
}
// Now safe to use user.userId
```

---

## Issue 4: Form Field Focus State Colors
**Problem:** Using red (#ff6b6b) for focus state makes users think there's an error.

**Solution:** Use blue (#64c8ff or #00d4ff) for focus state to indicate "active/focused":
```css
.input:focus,
.textarea:focus {
  outline: none;
  border-color: #64c8ff;
  background: rgba(100, 200, 255, 0.1);
  box-shadow: 0 0 0 3px rgba(100, 200, 255, 0.2);
}
```

---

## Checklist for New API Routes

- [ ] Import all models used with `.populate()`
- [ ] Use `user.userId` (not `user._id`) from JWT token
- [ ] Use `user.username` for username from token
- [ ] Destructure `{ authenticated, user, response }` from `authenticateRequest()`
- [ ] Check `if (!authenticated) return response;` before using user
- [ ] Test with actual token to verify field names exist
