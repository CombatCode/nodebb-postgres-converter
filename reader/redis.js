'use strict';

const redis = require('redis');
const { promisify } = require('util');

for (var fn of ['dbsize', 'scan', 'type', 'get', 'lrange', 'smembers', 'hgetall', 'zscan', 'pttl', 'zcard']) {
	redis.RedisClient.prototype[fn + 'Async'] = promisify(redis.RedisClient.prototype[fn]);
}

module.exports = async function(connection, count, realEach) {
	console.log('connection', connection);
	const client = redis.createClient(connection);

	const each = async function(data) {
		var ttl = parseInt(await client.pttlAsync(data._key), 10);
		if (ttl >= 0) {
			data.expireAt = Date.now() + ttl;
		}
		await realEach(data);
	};

	try {
		var totalKeys = 0;
		var realKeys = 0;
		var zcardKeys = 0;
		console.log('totalKeys', totalKeys);

		var cursor = '0';
		do {
			var result = await client.scanAsync(cursor, 'COUNT', '1000');
			cursor = result[0];
			console.log('totalKeys', totalKeys);
			totalKeys += result[1].length;
			realKeys += result[1].length;
			
			for (var key of result[1]) {
				var type = await client.typeAsync(key);

				if (type === 'string' && key.startsWith('sess:')) {
					totalKeys--;
				} else if (type === 'zset' && key.startsWith('ip:recent')) {
					totalKeys--;
				} else if (type === 'zset' && key.endsWith(':likes')) {
					totalKeys--;
				} else if (type === 'zset' && key.startsWith('product:likes_boost')) {
					totalKeys--;
				} else if (type === 'zset') {
					totalKeys += await client.zcardAsync(key) - 1;
					zcardKeys += await client.zcardAsync(key) - 1;
				}
			}
		} while (cursor !== '0');

		await count(totalKeys);
		console.log('totalKeys', totalKeys);
		console.log('realKeys', realKeys);
		console.log('zcardKeys', zcardKeys);
		cursor = '0';
		do {
			var result = await client.scanAsync(cursor, 'COUNT', '1000');
			cursor = result[0];

			for (var key of result[1]) {
				var type = await client.typeAsync(key);
				switch (type) {
					case 'string':
						if (key.startsWith('sess:')) {
							continue;
						}

						await each({
							_key: key,
							value: await client.getAsync(key)
						});
						break;
					case 'list':
						await each({
							_key: key,
							array: await client.lrangeAsync(key, '0', '-1')
						});
						break;
					case 'set':
						await each({
							_key: key,
							members: await client.smembersAsync(key)
						});
						break;
					case 'zset':
						if (key.startsWith('ip:recent')) {
							continue;
						} else if (key.endsWith(':likes')) {
							continue;
						} else if (key.startsWith('product:likes_boost')) {
							continue;
						}
						await eachSorted(client, key, each);
						break;
					case 'hash':
						var data = await client.hgetallAsync(key);
						data._key = key;
						await each(data);
						break;
					default:
						console.error('Unexpected redis type for key "' + key + '": ' + type);
				}
			}
		} while (cursor !== '0');
	} catch(err) {
	  console.log('ERROR', err)
	}
	finally {
		client.quit();
	}
};

async function eachSorted(client, key, each) {
	var cursor = '0';
	do {
		var result = await client.zscanAsync(key, cursor, 'COUNT', '1000');
		cursor = result[0];

		for (var i = 0; i < result[1].length; i += 2) {
			await each({
				_key: key,
				value: result[1][i],
				score: parseFloat(result[1][i + 1])
			});
		}
	} while (cursor !== '0');
}
