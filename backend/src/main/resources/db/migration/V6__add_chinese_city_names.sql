-- The city an airport serves, in Chinese, so the Chinese pages can say 上海 instead of
-- "Shanghai (Pudong)". NULL where no Chinese name is known; the page then shows the
-- English one.
--
-- This migration only adds the column. The names themselves are in
-- data/airport-cities-zh.csv and are written by the application at startup
-- (ChineseCityNames), like the airports: on a new database the airports table is still
-- empty while the migrations run, so an UPDATE here would change nothing.
ALTER TABLE airports ADD COLUMN city_zh TEXT;
