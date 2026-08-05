CREATE TABLE IF NOT EXISTS candidate_jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company_display VARCHAR(255),
  is_confidential BOOLEAN DEFAULT false,
  location VARCHAR(255),
  ctc_range_min INT,
  ctc_range_max INT,
  experience_min INT,
  experience_max INT,
  sector VARCHAR(255),
  description TEXT,
  highlights JSON DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  target_cand_ids JSON DEFAULT '[]',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_job_interests (
  id SERIAL PRIMARY KEY,
  job_id INT NOT NULL REFERENCES candidate_jobs(id) ON DELETE CASCADE,
  cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'Shown',
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(job_id, cand_id)
);

CREATE TABLE IF NOT EXISTS dream_company_status (
  id SERIAL PRIMARY KEY,
  cand_id VARCHAR(50) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Not Started',
  notes TEXT,
  updated_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cj_is_active_idx ON candidate_jobs(is_active);
CREATE INDEX IF NOT EXISTS cj_sector_idx ON candidate_jobs(sector);
CREATE INDEX IF NOT EXISTS cji_cand_id_idx ON candidate_job_interests(cand_id);
CREATE INDEX IF NOT EXISTS dcs_cand_id_idx ON dream_company_status(cand_id);
