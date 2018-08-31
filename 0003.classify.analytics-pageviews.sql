CREATE UNLOGGED TABLE "classify"."analytics_pageviews" (
	"hour" TIMESTAMPTZ NOT NULL PRIMARY KEY CHECK ("hour" = DATE_TRUNC('hour', "hour")),
	"count" BIGINT NOT NULL DEFAULT 0
) WITHOUT OIDS;

ALTER TABLE "classify"."analytics_pageviews" CLUSTER ON "analytics_pageviews_pkey";

INSERT INTO "classify"."analytics_pageviews"
SELECT TO_TIMESTAMP("unique_string"::NUMERIC / 1000),
       "value_numeric"::BIGINT
  FROM "classify"."unclassified"
 WHERE "_key" = 'analytics:pageviews'
   AND "type" = 'zset';

CREATE VIEW "classify"."analytics_pageviews_month" AS
SELECT CAST(DATE_TRUNC('month', "hour") AS DATE) "month",
       SUM("count") "count"
  FROM "classify"."analytics_pageviews"
 GROUP BY CAST(DATE_TRUNC('month', "hour") AS DATE);
