CREATE DOMAIN "classify".COVER_POSITION AS NUMERIC[2]
	NOT NULL DEFAULT '{50,50}'
	CHECK (CARDINALITY(VALUE) = 2
		AND VALUE[1] IS NOT NULL
		AND VALUE[2] IS NOT NULL
		AND VALUE[1] BETWEEN 0 AND 100
		AND VALUE[2] BETWEEN 0 AND 100);

CREATE FUNCTION "classify"."parse_cover_position"(value TEXT) RETURNS "classify".COVER_POSITION AS $$
	SELECT ARRAY[COALESCE(pos[1]::NUMERIC, 50), COALESCE(pos[2]::NUMERIC, 50)]::"classify".COVER_POSITION
	  FROM REGEXP_MATCH(value, '^(.*)% (.*)%$') pos;
$$ LANGUAGE SQL IMMUTABLE CALLED ON NULL INPUT PARALLEL SAFE;