-- Ultimate Music Cloner Database Schema
-- PostgreSQL schema for storing audio analysis, cloning sessions, and metadata

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- Songs table - stores analyzed songs
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint VARCHAR(64) UNIQUE NOT NULL,
    dna JSONB NOT NULL, -- Complete AudioDNA
    analysis_version INT NOT NULL DEFAULT 1,
    processing_time FLOAT,
    
    -- Searchable metadata
    title VARCHAR(255),
    artist VARCHAR(255),
    album VARCHAR(255),
    year INT,
    genre VARCHAR(100),
    duration FLOAT NOT NULL,
    
    -- File information
    original_format VARCHAR(20),
    file_size BIGINT,
    sample_rate INT,
    bit_rate INT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for JSONB queries
    CONSTRAINT valid_dna CHECK (jsonb_typeof(dna) = 'object')
);

-- Create indexes for songs
CREATE INDEX idx_songs_fingerprint ON songs(fingerprint);
CREATE INDEX idx_songs_artist_title ON songs(artist, title);
CREATE INDEX idx_songs_genre ON songs(genre);
CREATE INDEX idx_songs_year ON songs(year);
CREATE INDEX idx_songs_dna_gin ON songs USING gin(dna);
CREATE INDEX idx_songs_created_at ON songs(created_at DESC);

-- Cloning sessions table
CREATE TABLE cloning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
    
    -- Session metadata
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    iterations INT NOT NULL DEFAULT 0,
    final_similarity FLOAT,
    target_similarity FLOAT DEFAULT 0.95,
    
    -- Convergence data
    convergence_data JSONB,
    optimization_path JSONB,
    
    -- Input/Output
    input_type VARCHAR(20) NOT NULL, -- 'url', 'file', 'name', 'humming', 'description'
    input_data TEXT,
    output_lyrics TEXT,
    output_prompt TEXT,
    
    -- Suno integration
    suno_job_id VARCHAR(100),
    suno_audio_url TEXT,
    
    -- Resource usage
    processing_time_ms INT,
    cpu_usage FLOAT,
    memory_usage_mb INT,
    gpu_usage FLOAT,
    
    -- User information
    user_id UUID,
    ip_address INET,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Create indexes for cloning sessions
CREATE INDEX idx_cloning_sessions_status ON cloning_sessions(status);
CREATE INDEX idx_cloning_sessions_user_id ON cloning_sessions(user_id);
CREATE INDEX idx_cloning_sessions_created_at ON cloning_sessions(created_at DESC);
CREATE INDEX idx_cloning_sessions_similarity ON cloning_sessions(final_similarity DESC);

-- Style genome table - stores genre and style information
CREATE TABLE style_genome (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'genre', 'subgenre', 'style', 'influence'
    
    -- Markers for identification
    genre_markers JSONB NOT NULL,
    production_markers JSONB NOT NULL,
    cultural_markers JSONB NOT NULL,
    
    -- Statistics
    success_rate FLOAT DEFAULT 0,
    usage_count INT DEFAULT 0,
    avg_similarity FLOAT DEFAULT 0,
    
    -- Relationships
    parent_id UUID REFERENCES style_genome(id),
    related_styles UUID[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for style genome
CREATE INDEX idx_style_genome_name ON style_genome(name);
CREATE INDEX idx_style_genome_category ON style_genome(category);
CREATE INDEX idx_style_genome_parent_id ON style_genome(parent_id);
CREATE INDEX idx_style_genome_markers_gin ON style_genome USING gin(genre_markers, production_markers, cultural_markers);

-- Audio features cache table
CREATE TABLE audio_features_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL,
    feature_data JSONB NOT NULL,
    
    -- Cache metadata
    computation_time_ms INT,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(song_id, feature_type)
);

-- Create indexes for features cache
CREATE INDEX idx_audio_features_cache_song_id ON audio_features_cache(song_id);
CREATE INDEX idx_audio_features_cache_type ON audio_features_cache(feature_type);
CREATE INDEX idx_audio_features_cache_expires ON audio_features_cache(expires_at);

-- Similarity comparisons table
CREATE TABLE similarity_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    target_song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    
    -- Similarity scores
    overall_similarity FLOAT NOT NULL,
    melodic_similarity FLOAT,
    rhythmic_similarity FLOAT,
    harmonic_similarity FLOAT,
    timbral_similarity FLOAT,
    structural_similarity FLOAT,
    production_similarity FLOAT,
    emotional_similarity FLOAT,
    
    -- Detailed comparison
    comparison_details JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(source_song_id, target_song_id)
);

-- Create indexes for similarity comparisons
CREATE INDEX idx_similarity_comparisons_source ON similarity_comparisons(source_song_id);
CREATE INDEX idx_similarity_comparisons_target ON similarity_comparisons(target_song_id);
CREATE INDEX idx_similarity_comparisons_overall ON similarity_comparisons(overall_similarity DESC);

-- Processing queue table
CREATE TABLE processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(50) NOT NULL,
    priority INT DEFAULT 5,
    status VARCHAR(20) DEFAULT 'queued',
    
    -- Job data
    payload JSONB NOT NULL,
    result JSONB,
    error_message TEXT,
    
    -- Execution tracking
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Worker information
    worker_id VARCHAR(100),
    
    CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10),
    CONSTRAINT valid_queue_status CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Create indexes for processing queue
CREATE INDEX idx_processing_queue_status_priority ON processing_queue(status, priority DESC, scheduled_at);
CREATE INDEX idx_processing_queue_job_type ON processing_queue(job_type);
CREATE INDEX idx_processing_queue_scheduled ON processing_queue(scheduled_at);

-- Lyrics database table
CREATE TABLE lyrics_database (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    
    -- Lyrics data
    original_lyrics TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,
    
    -- Compressed versions
    compressed_5000 TEXT, -- Compressed to fit 5000 char limit
    compressed_3000 TEXT, -- More aggressive compression
    compressed_1000 TEXT, -- Maximum compression
    
    -- Analysis
    structure JSONB,
    themes TEXT[],
    sentiment_analysis JSONB,
    word_count INT,
    unique_words INT,
    
    -- Source information
    source VARCHAR(50), -- 'extracted', 'api', 'manual', 'ocr'
    confidence FLOAT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for lyrics database
CREATE INDEX idx_lyrics_database_song_id ON lyrics_database(song_id);
CREATE INDEX idx_lyrics_database_language ON lyrics_database(language);
CREATE INDEX idx_lyrics_database_themes_gin ON lyrics_database USING gin(themes);

-- Music prompts table
CREATE TABLE music_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES cloning_sessions(id) ON DELETE CASCADE,
    
    -- Prompt versions
    iteration INT NOT NULL,
    prompt_text TEXT NOT NULL,
    character_count INT NOT NULL,
    
    -- Components
    genre_component TEXT,
    tempo_component TEXT,
    mood_component TEXT,
    instrument_component TEXT,
    production_component TEXT,
    
    -- Performance
    similarity_score FLOAT,
    user_rating INT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_char_count CHECK (character_count <= 1000)
);

-- Create indexes for music prompts
CREATE INDEX idx_music_prompts_session_id ON music_prompts(session_id);
CREATE INDEX idx_music_prompts_iteration ON music_prompts(iteration);
CREATE INDEX idx_music_prompts_similarity ON music_prompts(similarity_score DESC);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    
    -- Preferences
    preferred_genres TEXT[],
    quality_preset VARCHAR(20) DEFAULT 'balanced',
    target_similarity FLOAT DEFAULT 0.95,
    language_preference VARCHAR(10) DEFAULT 'en',
    
    -- Usage statistics
    total_clones INT DEFAULT 0,
    successful_clones INT DEFAULT 0,
    avg_similarity FLOAT,
    favorite_artists TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user preferences
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- API keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID,
    name VARCHAR(100),
    
    -- Permissions and limits
    permissions JSONB DEFAULT '{}',
    rate_limit INT DEFAULT 100, -- requests per hour
    daily_limit INT DEFAULT 1000,
    
    -- Usage tracking
    total_requests BIGINT DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for API keys
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- System metrics table
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_type VARCHAR(20) NOT NULL, -- 'counter', 'gauge', 'histogram'
    
    -- Tags for grouping
    tags JSONB DEFAULT '{}',
    
    -- Aggregation support
    count INT DEFAULT 1,
    sum FLOAT,
    min FLOAT,
    max FLOAT,
    
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for system metrics
CREATE INDEX idx_system_metrics_name_time ON system_metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX idx_system_metrics_tags_gin ON system_metrics USING gin(tags);

-- Create partitioning for metrics table by month
CREATE TABLE system_metrics_2024_01 PARTITION OF system_metrics
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Error logs table
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    
    -- Context
    job_id UUID,
    user_id UUID,
    endpoint VARCHAR(100),
    
    -- Additional data
    context JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for error logs
CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_job_id ON error_logs(job_id);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_style_genome_updated_at BEFORE UPDATE ON style_genome
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lyrics_database_updated_at BEFORE UPDATE ON lyrics_database
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW v_recent_cloning_sessions AS
SELECT 
    cs.*,
    s.title as song_title,
    s.artist as song_artist,
    s.genre as song_genre
FROM cloning_sessions cs
LEFT JOIN songs s ON cs.original_song_id = s.id
WHERE cs.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY cs.created_at DESC;

CREATE VIEW v_genre_performance AS
SELECT 
    sg.name as genre,
    sg.category,
    COUNT(cs.id) as total_clones,
    AVG(cs.final_similarity) as avg_similarity,
    MAX(cs.final_similarity) as max_similarity,
    MIN(cs.final_similarity) as min_similarity
FROM style_genome sg
JOIN songs s ON s.genre = sg.name
JOIN cloning_sessions cs ON cs.original_song_id = s.id
WHERE cs.status = 'completed'
GROUP BY sg.name, sg.category
ORDER BY total_clones DESC;

-- Add comments for documentation
COMMENT ON TABLE songs IS 'Stores analyzed songs with their complete AudioDNA fingerprint';
COMMENT ON TABLE cloning_sessions IS 'Tracks each cloning attempt with convergence data and results';
COMMENT ON TABLE style_genome IS 'Genre and style definitions with identification markers';
COMMENT ON TABLE audio_features_cache IS 'Caches computed audio features for performance';
COMMENT ON TABLE similarity_comparisons IS 'Stores pairwise song similarity calculations';
COMMENT ON TABLE processing_queue IS 'Job queue for asynchronous processing tasks';
COMMENT ON TABLE lyrics_database IS 'Stores original and compressed lyrics with analysis';
COMMENT ON TABLE music_prompts IS 'Tracks generated prompts and their performance';
COMMENT ON TABLE user_preferences IS 'User settings and usage statistics';
COMMENT ON TABLE api_keys IS 'API authentication and rate limiting';
COMMENT ON TABLE system_metrics IS 'Time-series metrics for monitoring';
COMMENT ON TABLE error_logs IS 'Centralized error logging for debugging';