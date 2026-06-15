# Security Specification & Test-Driven Design (TDD) Blueprints

This document defines the security boundaries, data invariants, and malicious test vectors used to establish a zero-trust model for the Task Manager Firestore database.

## 1. Data Invariants

* **Board Namespace**: A Board document under `/boards/{boardId}` is strictly owned by the creator (`ownerId == request.auth.uid`). No public access is permitted.
* **Task Master Gate**: A Task document under `/boards/{boardId}/tasks/{taskId}` is only accessible if the parent Board's `ownerId` matches the authenticated user ID (`request.auth.uid`). Access to tasks is strictly derived from the board ownership.
* **Input Validation**: All IDs must strictly conform to a safe string pattern (e.g., Alphanumeric, underscores, hyphens, and size of at most 128 chars).
* **Terminal State Safety**: No field update is permitted on tasks or boards without complete compliance with the validated entity schemas (size limits, type constraints, enum values).
* **Temporal Integrity**: Creation and modification times (`createdAt`, `updatedAt`) must strictly match `request.time`. Clients cannot spoof historic or future dates due to server-side enforcement.
* **Immutable Fields**: High-value structural fields such as `ownerId`, `boardId` (or parent association), and `createdAt` are locked at creation and cannot be changed during updates.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following rogue payloads represent direct security penetration vectors. The Firestore security rules are mathematically obligated to reject all 12 of them.

### ID Poisoning & Resource Exhaustion (Denial-of-Wallet)
1. **Payload #1 (Junk ID Injection)**: Attempt to create a board with a massive 2KB document ID containing control characters.
   * *Expected Result*: `PERMISSION_DENIED` due to `isValidId(boardId)` character validation.
2. **Payload #2 (Unbounded Content Attack)**: Attempt to create a board with a standard ID but with a 2MB `description` string.
   * *Expected Result*: `PERMISSION_DENIED` due to `incoming().description.size() <= 1000` checking inside the validation helper.

### Privilege Escalation & Impersonation
3. **Payload #3 (Identity Spoofing - Creation)**: Authenticated user `Alice` (`uid: "alice_uid"`) attempts to create a board with `ownerId` set to `"bob_uid"`.
   * *Expected Result*: `PERMISSION_DENIED` because the validation helper enforces `incoming().ownerId == request.auth.uid`.
4. **Payload #4 (Identity Hijacking - Update)**: Authenticated user `Bob` attempts to transition a board's `ownerId` from `"bob_uid"` to `"alice_uid"` to transfer charges/ownership structures.
   * *Expected Result*: `PERMISSION_DENIED` because structural field changes violate the immutability guard `incoming().ownerId == existing().ownerId`.

### Master Gate & Relational Escape
5. **Payload #5 (Orphaned Task Creation)**: User `Alice` attempts to create a task inside `/boards/bob_board_id/tasks/task_123` where `bob_board_id` belongs to `Bob`.
   * *Expected Result*: `PERMISSION_DENIED` because the Task rules retrieve the parent "/boards/bob_board_id" and verify that the current user is its owner.
6. **Payload #6 (Cross-Project Board Injection)**: User `Alice` attempts to update a task to set its `boardId` metadata to refer to some other board (`alice_board_id`), escaping its original subcollection namespace.
   * *Expected Result*: `PERMISSION_DENIED` because `incoming().boardId == existing().boardId` restricts board reassignment.

### Schema & Enum Violations
7. **Payload #7 (Rogue Task Status)**: Attempt to update active task status from `'todo'` to `'archived'` (not in the allowed enum values).
   * *Expected Result*: `PERMISSION_DENIED` because task status must be one of `['todo', 'in_progress', 'completed']`.
8. **Payload #8 (Array Boundary Abuse)**: Attempt to add an array of 5,000 strings into `tags` to inflate read sizes.
   * *Expected Result*: `PERMISSION_DENIED` because tag sets are limited to `.size() <= 8` and all members are verified.

### Temporal Integrity Attack
9. **Payload #9 (Time Spoofing on Creation)**: Attempt to create a task with a backdated `createdAt` of `"1970-01-01T00:00:00Z"`.
   * *Expected Result*: `PERMISSION_DENIED` because the schema requires `incoming().createdAt == request.time`.
10. **Payload #10 (Time Spoofing on Update)**: Attempt to set `updatedAt` to a future date while editing task description.
    * *Expected Result*: `PERMISSION_DENIED` because rules require `incoming().updatedAt == request.time`.

### Shadow Update (Ghost Field Injections)
11. **Payload #11 (Rogue Admin Injection)**: Attempt to write a shadow field `isAdmin: true` or `isSuperUser: true` onto a board.
    * *Expected Result*: `PERMISSION_DENIED` because of exact schema key checking (`affectedKeys().hasOnly(...)` during updates and exact keys on creation).

### Query Trust Escalation
12. **Payload #12 (Malicious Collection Scraping)**: Logged-in user `Charlie` requests to list ALL items under `/boards` without providing a filter matching their user UID as sole owner.
    * *Expected Result*: `PERMISSION_DENIED` because the rules require that any query evaluates `resource.data.ownerId == request.auth.uid` instead of relying on client-side sorting.

---

## 3. The Rules Test Harness Structure (`firestore.rules.test.ts`)

A structural verification harness which can be used to run validation tests when the Node environment executes local rules tests:

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "hale-solution-f07pf",
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8')
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Task Manager Security Rules", () => {
  // Verifies that Payload 3 (Identity Spoofing) is rejected
  it("forces owners to match auth uid on board creation", async () => {
    const context = testEnv.authenticatedContext("alice_uid", { email_verified: true });
    const db = context.firestore();
    const boardRef = doc(db, "boards", "test_board");
    
    await expect(setDoc(boardRef, {
      title: "Alice's Space",
      ownerId: "bob_uid", // Spoofed
      createdAt: new Date(),
      updatedAt: new Date()
    })).rejects.toThrow();
  });
});
```
