-- Query top 10 players based on highest caught buterflies
SELECT username,
    caught_butterflies
FROM sessions
ORDER BY caught_butterflies DESC
LIMIT 10;