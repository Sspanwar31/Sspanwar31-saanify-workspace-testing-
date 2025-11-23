-- Database seed script for Supabase
-- TODO: Replace with actual seed data for production
-- This is a scaffold file

-- Insert super admin user
INSERT INTO users (id, email, name, password, role, is_active)
VALUES (
    'admin-001',
    'superadmin@saanify.com',
    'Super Admin',
    -- TODO: Replace with hashed password using bcrypt
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- 'admin123' hashed
    'SUPER_ADMIN',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample society accounts
INSERT INTO society_accounts (id, name, admin_name, email, phone, address, subscription_plan, status, is_active)
VALUES 
    ('society-001', 'Green Valley Society', 'Robert Johnson', 'admin@greenvalley.com', '+91 98765 43210', '123 Green Valley Road, Bangalore', 'PRO', 'ACTIVE', true),
    ('society-002', 'Sunset Apartments', 'Maria Garcia', 'admin@sunsetapartments.com', '+91 98765 43211', '456 Sunset Boulevard, Mumbai', 'TRIAL', 'TRIAL', true),
    ('society-003', 'Royal Residency', 'William Chen', 'admin@royalresidency.com', '+91 98765 43212', '789 Royal Street, Delhi', 'BASIC', 'EXPIRED', true),
    ('society-004', 'Blue Sky Heights', 'Patricia Williams', 'admin@blueskyheights.com', '+91 98765 43213', '321 Blue Sky Avenue, Pune', 'ENTERPRISE', 'LOCKED', true)
ON CONFLICT (email) DO NOTHING;

-- Insert society admin users
INSERT INTO users (id, email, name, password, role, society_account_id, is_active)
VALUES 
    ('user-001', 'admin@greenvalley.com', 'Robert Johnson', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'CLIENT', 'society-001', true),
    ('user-002', 'admin@sunsetapartments.com', 'Maria Garcia', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'CLIENT', 'society-002', true),
    ('user-003', 'admin@royalresidency.com', 'William Chen', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'CLIENT', 'society-003', false),
    ('user-004', 'admin@blueskyheights.com', 'Patricia Williams', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'CLIENT', 'society-004', false)
ON CONFLICT (email) DO NOTHING;

-- Insert demo client user
INSERT INTO users (id, email, name, password, role, society_account_id, is_active)
VALUES (
    'client-001',
    'client@saanify.com',
    'Demo Client',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- 'client123' hashed
    'CLIENT',
    'society-001',
    true
) ON CONFLICT (email) DO NOTHING;