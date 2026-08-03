# Job Management Architecture

## Flow
- Create: POST /jobs -> Find company -> Validate -> Create Job -> Notify
- Browse: GET /jobs?skills=&type=&search= -> Build filter -> Paginate (20) -> Populate company
- Update: PUT /jobs/:id -> Find by id+company -> Update -> Return

## Search & Filter
- Status: active, closed, draft
- Type: Full-time, Part-time, Internship, Contract
- Skills: comma-separated (skills=React,Node.js)
- Text: regex on title (case-insensitive)
- Pagination: page, limit, total, pages
- Sort: postedAt descending
- Populate: companyId -> companyName, industry, logoUrl, location