# EntityGate

**Entity** is an enterprise-grade security layer that protects APIs, smartlinks, and web applications from automated abuse.  
It blocks bots, scrapers, fake clicks, and fraudulent traffic in **real time**, ensuring campaigns and applications receive only valid user activity.

---

## Contents

- [Overview](#overview)
- [API Endpoints](#api-endpoints)
- [Request Headers](#request-headers)
- [Response Format](#response-format)
- [Block Reasons](#block-reasons)
- [Example Requests](#example-requests)
- [Testing & Debugging](#testing--debugging)
- [Security Best Practices](#security-best-practices)
- [Support](#support)

---

## Overview

Entity Antibot evaluates every request using multiple validation layers:

- Header & User-Agent integrity checks
- ASN & CIDR filtering
- Geo restrictions
- Device validation
- Rate limiting
- Bot heuristics & lists
- Google Safe Browsing integration

If a request fails validation, the API returns a **block response** with a reason code.

---

## API Endpoints

### 1. Validate Request

```http
GET https://api.entitygate.com/api/fortest/[shortlinkkey]
```

#### Parameters:

- Sent via JSON body.

```json
{
	"x-visitor-ip-asli": "203.0.113.42",
	"x-visitor-user-agent": "Mozilla/5.0 ...",
	"headers": {
		"x-visitor-accept-encoding": "text/html",
		"x-visitor-accept-language": "en-US,en;q=0.9",
		"x-visitor-sec-fetch-site": "none"
	},
	"url": "https://example.com/landing"
}
```

---

## Request Headers

Entity expects enriched visitor headers (recommended when used as middleware):

| Header                      | Description                         |
| --------------------------- | ----------------------------------- |
| `x-visitor-ip-asli`         | Original visitor IP                 |
| `x-visitor-user-agent`      | User agent string                   |
| `x-visitor-accept`          | HTTP Accept header                  |
| `x-visitor-accept-language` | Browser language settings           |
| `x-visitor-accept-encoding` | Content encoding accepted by client |
| `x-visitor-sec-fetch-site`  | Fetch site metadata                 |
| `x-visitor-sec-ch-ua`       | Client hint UA                      |

---

## Response Format

### Success Response (Allowed)

```json
{
	"success": true,
	"blocked": false,
	"visitorIp": "8.8.8.8",
	"deviceType": "desktop",
	"visitorCountry": "US",
	"visitorAsn": {
		"autonomous_system_number": 7018,
		"autonomous_system_organization": "GOOGLE"
	},
	"status": 200,
	"message": "Visitor passed all ENTITY API checks."
}
```

### Blocked Response

```json
{
	"success": false,
	"blocked": true,
	"reason": "asn_blocked",
	"visitorIp": "8.8.8.8",
	"deviceType": "desktop",
	"visitorCountry": "US",
	"visitorAsn": {
		"autonomous_system_number": 15169,
		"autonomous_system_organization": "GOOGLE"
	},
	"status": 403,
	"message": "Visitor blocked by ENTITY API."
}
```

---

## Block Reasons

| Code              | Description                          |
| ----------------- | ------------------------------------ |
| `asn_blocked`     | Blocked due to ASN restrictions      |
| `cidr_blocked`    | Blocked due to CIDR/IP blocklist     |
| `country_blocked` | Blocked due to country restrictions  |
| `header_fail`     | Suspicious/malformed request headers |
| `rate_limited`    | Too many requests from the same IP   |
| `bot_detected`    | Identified as known or heuristic bot |
| `safe_fail`       | URL flagged by Google Safe Browsing  |

---

## Example Requests

### Using curl

```bash
curl "https://entitygate.com/api/fortest/entity" ^
  -H "Accept: */*" ^
  -H "Accept-Language: en-US,en;q=0.9" ^
  -H "Connection: keep-alive" ^
  -H "Referer: https://entitygate.com/" ^
  -H "Sec-Fetch-Dest: empty" ^
  -H "Sec-Fetch-Mode: cors" ^
  -H "Sec-Fetch-Site: same-origin" ^
  -H "User-Agent: Curl" ^
  -H "sec-ch-ua: \"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"" ^
  -H "sec-ch-ua-mobile: ?0" ^
  -H "sec-ch-ua-platform: \"Windows\"" ^
  -H "x-entity-api-key: entity" ^
  -H "x-visitor-ip-asli: 8.8.8.8" ^
  -H "x-visitor-sec-ch-ua: \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"" ^
  -H "x-visitor-sec-fetch-site: same-origin" ^
  -H "x-visitor-user-agent: Curl"
```

---

## Testing & Debugging

- Use staging endpoints before production deployment.
- Enable verbose logging to capture block reasons.
- Monitor Redis rate-limits and MongoDB request logs.
- Compare allowed vs blocked traffic in analytics dashboard.

---

## Security Best Practices

- Keep CIDR & bot lists updated regularly.
- Rotate API keys frequently.
- Enforce HTTPS across all endpoints.
- Monitor for unusual traffic patterns.

---

## Supports

For enterprise support, contact **Entity Security Team**:

- 🌐 Website: [EntityGate](https://entitygate.net)
- 📧 Email: support@entitygate.net
