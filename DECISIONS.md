# Engineering Decisions — Customer Inquiry Management System

## 1. Assumptions

- The application is intended for internal staff who need a central place to manage customer inquiries.
- Staff accounts are seeded instead of allowing public registration.
- PostgreSQL is the persistent source of truth for inquiry data.
- All authenticated staff can access the shared inquiry list. Individual inquiry ownership restrictions are not part of the current implementation.
- An inquiry follows the lifecycle `New → In Progress → Resolved`. Resolved inquiries cannot be reopened through the normal workflow.

## 2. Design Decisions

### Backend authentication and validation

JWT authentication is enforced by the Express backend for protected endpoints. This ensures that access control does not depend only on frontend pages or hidden buttons. Input validation and status-transition rules are also enforced by the API because requests can be made directly without using the interface.

### Separation of frontend, backend, and database

The frontend uses React and Vite, while Node.js and Express provide the API. PostgreSQL stores inquiry data persistently. This separation keeps the user interface independent from database operations and makes the main workflow easier to maintain and test.

### Controlled status lifecycle and duplicate review

Status transitions are restricted to the defined inquiry lifecycle. Invalid transitions should return an understandable error instead of silently changing the record.

Possible duplicate inquiries are presented for staff review. A record should only be marked as a duplicate after an explicit staff confirmation. This keeps the final decision under staff control rather than relying entirely on automatic similarity matching.

## 3. Trade-off

I prioritized a straightforward shared-access workflow over implementing individual inquiry ownership and complex permissions. This keeps the assessment scope manageable, but it means the application does not restrict inquiries to specific employees.

The application does not implement real-time synchronization between browser tabs. If an inquiry changes in another tab, the displayed data can become stale. Refreshing the record and handling rejected updates provide a simpler approach than implementing real-time events or full concurrency control. A version field or conditional database update would be a possible improvement.

## 4. Future Improvements

- Expand automated tests for authentication, validation, status transitions, and frontend error states.
- Improve stale-data detection and prevent conflicting updates using version-based concurrency control.
- Review duplicate matching to ensure it remains reliable and understandable.
- Introduce inquiry ownership if the business requires employee-level access restrictions.
- Add structured logging and monitoring for unexpected API failures.

## 5. AI Assistance and External Resources

AI tools and technical documentation were used as development aids to understand implementation options, review code structure, and identify potential edge cases. Suggestions were evaluated against the assessment requirements and adapted to the existing project rather than accepted without review.

One design consideration was duplicate detection. Rather than automatically marking a record as a duplicate based only on similarity, the intended workflow requires staff to review a possible match and explicitly confirm the decision.

The implementation and test results should be verified before submission. I am responsible for understanding the submitted code, explaining the design choices and limitations, and making changes when required during the technical discussion.
