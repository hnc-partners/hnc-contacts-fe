# Backend API Requests - Contacts Frontend

## Summary

APIs and fields that the Contacts frontend needs but don't exist yet on the backend.

---

## 1. `joinDate` field on Contact entity

**Priority: High**

The Contact entity needs a `joinDate` field (date when the person/org joined, separate from the DB `createdAt` timestamp).

**What's needed:**
- Add `joinDate: Date | null` column to the `contacts` table
- Accept `joinDate` in `POST /contacts` (CreateContactDto)
- Accept `joinDate` in `PATCH /contacts/:id` (UpdateContactDto)
- Return `joinDate` in `GET /contacts` list and `GET /contacts/:id` detail responses
- Support filtering by `joinDate` range in `GET /contacts` (query params: `joinDateFrom`, `joinDateTo`)

**Frontend usage:**
- Add/Edit contact modals have a Join Date date picker
- Contacts table has a "Join Date" column
- Filter bar has a join date filter

---

## 2. Fix P2022 error on `/hnc-members` endpoint

**Priority: High (blocking)**

The `/hnc-members` endpoint returns a 500 error:
```json
{
  "type": "/errors/internal",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "Database error: P2022"
}
```

Prisma P2022 = "The column does not exist in the database". The Prisma schema for `hnc_members` references a column that doesn't exist in the actual DB table.

**Impact:** Breaks ALL role loading in the side panel (players and partners also fail because of Promise.all). Frontend has a workaround now (Promise.allSettled) but hnc_member roles still won't display until this is fixed.

---

## 3. Gaming Accounts API

**Priority: Medium**

CRUD endpoints for managing gaming accounts per contact.

**Endpoints needed:**
- `GET /gaming-accounts?contactId={id}` - List gaming accounts for a contact
- `POST /gaming-accounts` - Create a gaming account
- `PATCH /gaming-accounts/:id` - Update a gaming account
- `DELETE /gaming-accounts/:id` - Delete a gaming account

**Expected fields (based on frontend placeholder):**
- `id: string`
- `contactId: string`
- `platform: string` (e.g., "PokerStars", "GGPoker", etc.)
- `username: string`
- `accountId: string | null`
- `status: 'active' | 'inactive'`
- `createdAt: string`
- `updatedAt: string`

**Frontend usage:** Side panel "Gaming Accounts" tab shows a list of accounts per contact with add/edit/delete capabilities.

---

## 4. Deals API

**Priority: Medium**

CRUD endpoints for managing deals per contact.

**Endpoints needed:**
- `GET /deals?contactId={id}` - List deals for a contact
- `POST /deals` - Create a deal
- `PATCH /deals/:id` - Update a deal
- `DELETE /deals/:id` - Delete a deal

**Expected fields (based on frontend placeholder):**
- `id: string`
- `contactId: string`
- `dealType: string`
- `description: string | null`
- `status: 'active' | 'inactive' | 'completed'`
- `startDate: string | null`
- `endDate: string | null`
- `terms: string | null`
- `createdAt: string`
- `updatedAt: string`

**Frontend usage:** Side panel "Deals" tab and dropdown submenu "Manage Deals" / "View Deal History".

---

## 5. Transaction History API

**Priority: Low**

Endpoint for viewing transaction history per contact.

**Endpoints needed:**
- `GET /transactions?contactId={id}` - List transactions for a contact (paginated)

**Frontend usage:** Dropdown menu "Transaction History" action (currently shows "coming soon" toast).

---

## 6. Commission Report API

**Priority: Low**

Endpoint for generating/viewing commission reports per contact.

**Endpoints needed:**
- `GET /reports/commission?contactId={id}` - Get commission report for a contact

**Frontend usage:** Dropdown menu "Commission Report" action (currently shows "coming soon" toast).

---

## Notes

- All endpoints should follow the existing API patterns (x-api-key auth, JSON responses with `{ data: ... }` wrapper, pagination with `{ page, limit, total, totalPages }`)
- All endpoints should support the standard error format used by the contacts service
