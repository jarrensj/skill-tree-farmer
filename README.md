## how to run the project

install the dependencies:

```bash
npm install
```

copy the example env file and add your keys

```bash
cp .env.example .env
```

run the development server:

```bash
npm run dev
```

open [http://localhost:3000](http://localhost:3000) with your browser

## database schema

### node table

| Field | Type | Description |
|-------|------|-------------|
| id | unique | |
| name | string | node name ("left crossover") |
| description | string | node description |
| image | string | image url / path |
| children | array of node_identifiers | nodes that are unlocked from the parent (this node) |
| prereq | array | prerequisites before marking as complete |
| skill_tree_slug | string | associated skill tree identifier |
| node_identifier | string | identifier for the node ("left_crossover") |
| exp | int | experience points reward for completing this node |
| criteria | array of objects | list of objects outlining success requirements |

| Criteria Object Model |
| Field | Type | Description |
|-------|------|-------------|
| set_count? | number | volume of sets for the exercise if applicable |
| rep_count? | number | count of reps per set for the exercise if applicable |
| duration? | number | duration of the exercise per set if applicable |
| weight? | number | weighted used for the exercise if applicable |

**notes:**
- the `children` field is used to create the skill tree structure
- the `prereq` field is checked to ensure prerequisites are met before marking a node as complete

### user progression table

| Field | Type | Description |
|-------|------|-------------|
| user_id | string | user identifier |
| skill_tree_slug | string | associated skill tree identifier |
| node_attempts | array of objects | list of a users attempts at completing a node | 

| node_attempts Object Model |
| Field | Type | Description |
|-------|------|-------------|
| skill_tree_slug | string | associated skill tree identifier |
| node_id | unique | foreign key from Node table |
| node_name | string | node name ("left crossover") |
| date | timestamp | date & time the user attempted the node |
| result | string | 'success' or 'fail' |
| set_count? | number | volume of sets for the exercise if applicable |
| rep_count? | number | count of reps per set for the exercise if applicable |
| duration? | number | duration of the exercise per set if applicable |
| weight? | number | weighted used for the exercise if applicable |


**notes:**
- query by `user_id` and the related `skill_tree` to get a user's progress

### skill tree table

| Field | Type | Description |
|-------|------|-------------|
| name | string | skill tree name |
| slug | string | url-friendly version of the name |
| description | string | skill tree description |
| image | string | image url / path |
| category | string[] | categories that this skill tree belongs to |

### users table
| Field | Type | Description |
|-------|------|-------------|
| id | unique | matches clerk_id |
| email | text |  |
| created_at | timestamp |  |
| last_seen | timestamp |  |
| clerk_id | text | from Clerk & Supabase integration |
| skill_trees | array of objects | list of objects with skill_tree_slug and status ("in_progress" or "completed") |
