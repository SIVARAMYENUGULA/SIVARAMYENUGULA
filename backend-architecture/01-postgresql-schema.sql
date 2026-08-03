-- ============================================================
-- PlaceMux PostgreSQL Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('student', 'company', 'college', 'admin');
CREATE TYPE assessment_type AS ENUM ('Technical', 'Aptitude', 'Soft_Skills', 'Domain');
CREATE TYPE assessment_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE job_status AS ENUM ('active', 'closed', 'draft');
CREATE TYPE job_type AS ENUM ('Full_time', 'Part_time', 'Internship', 'Contract');
CREATE TYPE application_status AS ENUM ('Applied', 'Shortlisted', 'Interview', 'Accepted', 'Rejected');
CREATE TYPE interview_type AS ENUM ('Technical', 'HR', 'Cultural', 'Final');
CREATE TYPE interview_status AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled');
CREATE TYPE candidate_status AS ENUM ('Available', 'Interviewing', 'Placed', 'Not_Available');
CREATE TYPE skill_level AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');

-- ============================================================
-- USERS (base table for all roles)
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role NOT NULL,
  avatar          VARCHAR(500),
  is_verified     BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  refresh_token   TEXT,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- STUDENT PROFILES
-- ============================================================
CREATE TABLE student_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  college_id        UUID, -- references colleges
  course            VARCHAR(255),
  year              INTEGER CHECK (year >= 1 AND year <= 6),
  phone             VARCHAR(20),
  linkedin_url      VARCHAR(500),
  portfolio_url     VARCHAR(500),
  resume_url        VARCHAR(500),
  bio               TEXT,
  profile_completed INTEGER DEFAULT 0 CHECK (profile_completed >= 0 AND profile_completed <= 100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_profiles_college ON student_profiles(college_id);

-- ============================================================
-- COMPANY PROFILES
-- ============================================================
CREATE TABLE company_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  industry        VARCHAR(255),
  company_size    VARCHAR(50),
  location        VARCHAR(255),
  website         VARCHAR(500),
  description     TEXT,
  logo_url        VARCHAR(500),
  verified        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COLLEGE PROFILES
-- ============================================================
CREATE TABLE college_profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  college_name     VARCHAR(255) NOT NULL,
  location         VARCHAR(255),
  website          VARCHAR(500),
  total_students   INTEGER DEFAULT 0,
  placement_rate   DECIMAL(5,2) DEFAULT 0,
  average_package  DECIMAL(12,2) DEFAULT 0,
  verified         BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ADMIN PROFILES
-- ============================================================
CREATE TABLE admin_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  permissions   TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SKILLS
-- ============================================================
CREATE TABLE skills (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL UNIQUE,
  category    VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skills_name ON skills(name);

-- Student Skills (junction)
CREATE TABLE student_skills (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  skill_id      UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level         skill_level NOT NULL DEFAULT 'Beginner',
  endorsements  INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, skill_id)
);

CREATE INDEX idx_student_skills_student ON student_skills(student_id);

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  location        VARCHAR(255),
  type            job_type NOT NULL,
  salary_min      DECIMAL(12,2),
  salary_max      DECIMAL(12,2),
  salary_currency VARCHAR(10) DEFAULT 'INR',
  skills_required TEXT[] DEFAULT '{}',
  applicants_count INTEGER DEFAULT 0,
  status          job_status NOT NULL DEFAULT 'draft',
  posted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_posted ON jobs(posted_at DESC);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  status          application_status NOT NULL DEFAULT 'Applied',
  resume_url      VARCHAR(500),
  cover_letter    TEXT,
  additional_info JSONB,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, student_id)
);

CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);

-- ============================================================
-- ASSESSMENTS
-- ============================================================
CREATE TABLE assessments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(255) NOT NULL,
  type          assessment_type NOT NULL,
  max_score     INTEGER NOT NULL DEFAULT 100,
  duration      INTEGER NOT NULL, -- minutes
  passing_score INTEGER DEFAULT 60,
  description   TEXT,
  instructions  TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assessment attempt / result (per student)
CREATE TABLE assessment_attempts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  status          assessment_status NOT NULL DEFAULT 'pending',
  score           INTEGER DEFAULT 0,
  max_score       INTEGER NOT NULL DEFAULT 100,
  answers         JSONB,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  time_taken_sec  INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assessment_id, student_id)
);

CREATE INDEX idx_assessment_attempts_student ON assessment_attempts(student_id);

-- Questions
CREATE TABLE assessment_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  options         TEXT[] NOT NULL,
  correct_index   INTEGER NOT NULL,
  points          INTEGER DEFAULT 10,
  order_index     INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessment_questions_assessment ON assessment_questions(assessment_id);

-- ============================================================
-- INTERVIEWS
-- ============================================================
CREATE TABLE interviews (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  application_id    UUID REFERENCES applications(id) ON DELETE SET NULL,
  candidate_name    VARCHAR(255) NOT NULL,
  candidate_email   VARCHAR(255),
  candidate_avatar  VARCHAR(500),
  job_title         VARCHAR(255) NOT NULL,
  date              DATE NOT NULL,
  time              TIME NOT NULL,
  duration          INTEGER NOT NULL DEFAULT 60, -- minutes
  interview_type    interview_type NOT NULL,
  status            interview_status NOT NULL DEFAULT 'Scheduled',
  notes             TEXT,
  feedback          TEXT,
  rating            INTEGER CHECK (rating >= 1 AND rating <= 5),
  scheduled_by      UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interviews_company ON interviews(company_id);
CREATE INDEX idx_interviews_date ON interviews(date);
CREATE INDEX idx_interviews_status ON interviews(status);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  type        VARCHAR(50) NOT NULL DEFAULT 'info',
  is_read     BOOLEAN DEFAULT false,
  link        VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(255) NOT NULL,
  details     TEXT,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- SAVED JOBS (bookmarks)
-- ============================================================
CREATE TABLE saved_jobs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, job_id)
);

-- ============================================================
-- TRIGGER: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_profiles_updated_at BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_college_profiles_updated_at BEFORE UPDATE ON college_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
