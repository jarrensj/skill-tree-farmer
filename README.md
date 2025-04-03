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


**notes:**
- the `children` field is used to create the skill tree structure
- the `prereq` field is checked to ensure prerequisites are met before marking a node as complete

### user progression table

| Field | Type | Description |
|-------|------|-------------|
| user_id | string | user identifier |
| skill_tree_slug | string | associated skill tree identifier |
| nodes_unlocked | array | list of their unlocked nodes |

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