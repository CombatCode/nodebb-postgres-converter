DELETE FROM "classify"."unclassified" uc
 WHERE uc."_key" SIMILAR TO 'group:cid:[0-9]+:privileges:(groups:)?(chat|find|moderate|posts:(delete|downvote|edit|history|view_deleted|upvote)|read|search:(content|tags|users)|signature|topics:(create|delete|read|reply|tag)|upload:post:(image|file)):members'
   AND uc."type" = 'zset';

DELETE FROM "classify"."unclassified" uc
 WHERE uc."_key" SIMILAR TO 'group:cid:[0-9]+:privileges:(groups:)?(chat|find|moderate|posts:(delete|downvote|edit|history|view_deleted|upvote)|read|search:(content|tags|users)|signature|topics:(create|delete|read|reply|tag)|upload:post:(image|file))'
   AND uc."type" = 'hash';

DELETE FROM "classify"."unclassified" uc
 WHERE uc."_key" IN ('groups:createtime', 'groups:visible:memberCount')
   AND uc."type" = 'zset'
   AND uc."unique_string" SIMILAR TO 'cid:[0-9]+:privileges:(groups:)?(chat|find|moderate|posts:(delete|downvote|edit|history|view_deleted|upvote)|read|search:(content|tags|users)|signature|topics:(create|delete|read|reply|tag)|upload:post:(image|file))';