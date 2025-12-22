CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  salt BYTEA NOT NULL,
  verifier BYTEA NOT NULL,
  app_role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_app_role_id ON users(app_role_id);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  is_app_role BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '[]' 
);

CREATE INDEX idx_roles_name ON roles(name);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  category TEXT,
  owner_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);

CREATE TABLE boards (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  position INTEGER DEFAULT 0,
  category VARCHAR(120) DEFAULT 'General',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_boards_project_id ON boards(project_id);
CREATE INDEX idx_boards_position ON boards(position);


CREATE TABLE project_memberships (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_memberships_project_id ON project_memberships(project_id);
CREATE INDEX idx_project_memberships_user_id ON project_memberships(user_id);
CREATE INDEX idx_project_memberships_role_id ON project_memberships(role_id);

CREATE TABLE board_memberships (
  id SERIAL PRIMARY KEY,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (board_id, user_id)
);

CREATE INDEX idx_board_memberships_board_id ON board_memberships(board_id);
CREATE INDEX idx_board_memberships_user_id ON board_memberships(user_id);
CREATE INDEX idx_board_memberships_role_id ON board_memberships(role_id);


CREATE TABLE lists (
  id SERIAL PRIMARY KEY,
  board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  position INTEGER DEFAULT 0
);

CREATE INDEX idx_lists_board_id ON lists(board_id);
CREATE INDEX idx_lists_position ON lists(position);

CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  position INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'low' 
);

CREATE INDEX idx_cards_list_id ON cards(list_id);
CREATE INDEX idx_cards_position ON cards(position);
CREATE INDEX idx_cards_created_by ON cards(created_by);

CREATE TABLE card_contents (
  card_id INTEGER PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ NULL,
  content_html TEXT  NULL,
  status VARCHAR(50) NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE card_assignees (
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, user_id)
);

CREATE INDEX idx_card_assignees_card_id ON card_assignees(card_id);
CREATE INDEX idx_card_assignees_user_id ON card_assignees(user_id);

CREATE TABLE card_comments (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_card_comments_card_id ON card_comments(card_id);
CREATE INDEX idx_card_comments_user_id ON card_comments(user_id);
CREATE INDEX idx_card_comments_created_at ON card_comments(created_at);

