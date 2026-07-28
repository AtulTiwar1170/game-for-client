# Application Scaling & User Capacity Analysis

This document outlines the user handling capacity of this MERN application under the current setup (in-memory mock storage) and details the roadmap to scale it to handle millions of active users once MongoDB, caching layers, and clustering are introduced.

---

## 1. Current Phase (In-Memory Mock Storage)
In the current setup, all session logs, attempts, and admin settings are held in server RAM.

| Metric | Capacity | Details |
| :--- | :--- | :--- |
| **Concurrent Active Users** | **~5,000 to 10,000** | Determined by the CPU and network bandwidth of a single Node.js process. |
| **Max Attempt Logs (RAM Limit)** | **~500,000 entries** | In-memory arrays consume small amounts of memory (~100 bytes per object). 500,000 entries consume only ~50MB of RAM, leaving plenty of space on standard hosting instances. |
| **API Response Time** | **< 15ms** | In-memory access is extremely fast because there are no external database network hops. |

---

## 2. Target Production Phase (MongoDB Integration)
Migrating the transient arrays to MongoDB ensures persistent logs, atomic increment operations, and horizontal scaling.

### Schema Optimizations for Scale
To support large amounts of read/write traffic:
1. **Indexes**: Unique index on `userId` in `AdminOverrideSchema` and compound index on `{ userId: 1, date: -1 }` in `GameLogSchema` for quick query response times.
2. **Aggregations**: Using lean queries (`.lean()`) to skip Mongoose hydration overhead for read-heavy operations like fetching results and predictions.

---

## 3. High Concurrency Scaling Roadmap (Millions of Users)
To scale this informational platform to support peak times (like the 6:00 AM - 7:00 AM result declaration windows), we implement the following layers:

### A. Caching Layer (Redis)
Since the live results and numerology predictions only change a few times a day (specifically during scheduled morning slots):
* **Result Cache**: Cache `GET /api/results/today` and `GET /api/predictions/today` responses in Redis with a Time-To-Live (TTL) of 60 seconds.
* **Impact**: Bypasses the database entirely for 99.9% of incoming read traffic. A single Redis instance can easily handle **100,000+ queries per second (QPS)**.

### B. Node.js Clustering & Load Balancing
* **PM2 Clustering**: Run Express in cluster mode, launching one process per CPU core.
* **Horizontal Scaling (Nginx / ALB)**: Set up an Application Load Balancer to distribute incoming traffic across multiple container instances (e.g., AWS ECS or Kubernetes pods).

### C. Rate Limiting
* Prevent brute-force spamming of the guess endpoint (`POST /api/game/guess`) by implementing rate limits per IP using `express-rate-limit`:
  ```javascript
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per window
  });
  ```

---

## 4. AWS EC2 Instance Recommendations (Upto 10,000 Users)

To run this application cost-effectively while guaranteeing responsive server performance (<50ms response times) for up to 10,000 concurrent active users:

### Option A: Single Instance Setup (Simple & Cost-Effective)
* **Recommended EC2 Instance**: **`t3.medium`** (or AMD equivalent **`t3a.medium`**)
* **Specifications**: 2 vCPUs (Intel Xeon / AMD EPYC), 4 GiB RAM, Network Up to 5 Gbps.
* **Why this is sufficient**:
  - **CPU**: Having 2 vCPUs allows you to run Node.js in cluster mode with 2 workers using PM2, handling parallel thread execution.
  - **RAM**: 4 GiB memory is highly sufficient to run Node.js process (~100-200MB per worker), serve React static files (~50MB), and run local Redis cache (~100MB).
  - **Cost**: Around **$25 to $30 / month** (significantly cheaper on Spot instances or Reserved Instances).

### Option B: Production Split Architecture (Standard Scalability)
If you want to isolate database compute from web servers:
1. **Application Server (EC2)**: **`t3.small`** (2 vCPUs, 2 GiB RAM). Runs the Node/Express backend PM2 processes.
2. **Database (MongoDB Atlas)**: Deploy on a shared or dedicated **`M10`** tier instance. This offloads CPU write bottlenecks away from your EC2 compute instance.

---

## 5. Adding Local MongoDB and Kafka Sizing Adjustments

If you decide to host **Local MongoDB** and **Apache Kafka** (along with Zookeeper/KRaft) on the **same single EC2 instance**, the memory and CPU requirements increase significantly.

### Memory Overhead Breakdown
* **Node.js PM2 Workers**: ~400 MiB
* **Local MongoDB**: ~1.5 GiB (MongoDB's WiredTiger engine consumes 50% of available RAM by default).
* **Kafka & ZooKeeper/KRaft (JVM)**: ~2.0 GiB (Java Virtual Machines require pre-allocated heap spaces; standard settings allocate 1GB to Kafka and 512MB-1GB to Zookeeper).
* **Operating System overhead**: ~500 MiB
* **Total RAM Required**: **~4.5 GiB to 5.0 GiB (Minimum)**

### Sizing Recommendation
* **Recommended EC2 Instance**: **`t3.large`** (2 vCPUs, **8 GiB RAM**)
* **Why**: A `t3.medium` (4 GiB RAM) will suffer from Out-Of-Memory (OOM) crashes as Kafka and MongoDB compete for cache limits. Upgrading to a `t3.large` ensures 8 GiB of headroom, preventing bottlenecks.
* **Production Recommendation**: If traffic peaks, upgrade to a compute/memory balanced **`t3.xlarge`** (4 vCPUs, 16 GiB RAM) or run Kafka on a managed queue service like AWS MSK to protect Web API stability.


