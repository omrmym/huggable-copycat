
-- Drop and recreate FK constraints with ON DELETE CASCADE for all tables referencing radius_users

ALTER TABLE transactions DROP CONSTRAINT transactions_radius_user_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_radius_user_id_fkey FOREIGN KEY (radius_user_id) REFERENCES radius_users(id) ON DELETE CASCADE;

ALTER TABLE bandwidth_history DROP CONSTRAINT bandwidth_history_radius_user_id_fkey;
ALTER TABLE bandwidth_history ADD CONSTRAINT bandwidth_history_radius_user_id_fkey FOREIGN KEY (radius_user_id) REFERENCES radius_users(id) ON DELETE CASCADE;

ALTER TABLE device_change_requests DROP CONSTRAINT device_change_requests_radius_user_id_fkey;
ALTER TABLE device_change_requests ADD CONSTRAINT device_change_requests_radius_user_id_fkey FOREIGN KEY (radius_user_id) REFERENCES radius_users(id) ON DELETE CASCADE;

ALTER TABLE mikrotik_sync_log DROP CONSTRAINT mikrotik_sync_log_radius_user_id_fkey;
ALTER TABLE mikrotik_sync_log ADD CONSTRAINT mikrotik_sync_log_radius_user_id_fkey FOREIGN KEY (radius_user_id) REFERENCES radius_users(id) ON DELETE CASCADE;

ALTER TABLE reseller_user_recharges DROP CONSTRAINT reseller_user_recharges_radius_user_id_fkey;
ALTER TABLE reseller_user_recharges ADD CONSTRAINT reseller_user_recharges_radius_user_id_fkey FOREIGN KEY (radius_user_id) REFERENCES radius_users(id) ON DELETE CASCADE;
