---
layout: page
title: 'Step 6: Performance Optimization'
permalink: /performance-optimization/
nav_order: 10
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Phase 5: High-Performance Optimizations

## Step 25: Apply Ceph Performance Optimizations

**Configure Ceph for high-performance hardware (64GB RAM, 13th Gen Intel, NVMe drives):**

```bash
# Memory optimizations (8GB per OSD for 64GB system):
ssh n2 "ceph config set osd osd_memory_target 8589934592"

# BlueStore optimizations:
ssh n2 "ceph config set osd bluestore_cache_size_ssd 4294967296"
ssh n2 "ceph config set osd bluestore_cache_kv_max 2147483648"
ssh n2 "ceph config set osd bluestore_cache_meta_ratio 0.4"
ssh n2 "ceph config set osd bluestore_compression_algorithm lz4"
ssh n2 "ceph config set osd bluestore_compression_mode aggressive"

# Network optimizations:
ssh n2 "ceph config set osd osd_heartbeat_grace 20"
ssh n2 "ceph config set osd osd_heartbeat_interval 5"

# CPU optimizations:
ssh n2 "ceph config set osd osd_op_num_threads_per_shard 2"
ssh n2 "ceph config set osd osd_op_num_shards 12"

# Scrubbing optimizations:
ssh n2 "ceph config set osd osd_scrub_during_recovery false"
ssh n2 "ceph config set osd osd_scrub_begin_hour 1"
ssh n2 "ceph config set osd osd_scrub_end_hour 5"
```

**Restart OSD services to apply optimizations:**

```bash
# Restart OSDs on all nodes:
for node in n2 n3 n4; do
  echo "=== Restarting OSDs on $node ==="
  ssh $node "systemctl restart ceph-osd@*.service"
  sleep 10  # Wait between nodes
done
```

## Step 26: Apply System-Level Optimizations

**OS-level tuning for maximum performance:**

```bash
# Apply on all mesh nodes:
for node in n2 n3 n4; do
  ssh $node "
    # Network tuning:
    echo 'net.core.rmem_max = 268435456' >> /etc/sysctl.conf
    echo 'net.core.wmem_max = 268435456' >> /etc/sysctl.conf
    echo 'net.core.netdev_max_backlog = 30000' >> /etc/sysctl.conf

    # Memory tuning:
    echo 'vm.swappiness = 1' >> /etc/sysctl.conf
    echo 'vm.min_free_kbytes = 4194304' >> /etc/sysctl.conf

    # Apply settings:
    sysctl -p
  "
done
```

## Step 27: Verify Optimizations Are Active

**Check that all optimizations are applied:**

```bash
# Verify key Ceph optimizations:
ssh n2 "ceph config dump | grep -E '(memory_target|cache_size|compression|heartbeat)'"
```

**Expected output (sample):**

```
osd/osd_memory_target                    8589934592
osd/bluestore_cache_size_ssd            4294967296
osd/bluestore_compression_algorithm     lz4
osd/osd_heartbeat_grace                 20
osd/osd_heartbeat_interval              5
```

**Check system-level optimizations:**

```bash
# Verify network and memory settings:
for node in n2 n3 n4; do
  echo "=== System tuning on $node ==="
  ssh $node "sysctl net.core.rmem_max vm.swappiness"
done
```

## Performance Testing

### Step 28: Run Performance Benchmarks

**Test optimized cluster performance:**

```bash
# Test write performance with optimized cluster:
ssh n2 "rados -p cephtb4 bench 10 write --no-cleanup -b 4M -t 16"

# Test read performance:
ssh n2 "rados -p cephtb4 bench 10 rand -t 16"

# Clean up test data:
ssh n2 "rados -p cephtb4 cleanup"
```

### Expected Performance Results

**Write Performance:**

- **Average Bandwidth:** 1,294 MB/s
- **Peak Bandwidth:** 2,076 MB/s
- **Average IOPS:** 323
- **Average Latency:** ~48ms

**Read Performance:**

- **Average Bandwidth:** 1,762 MB/s
- **Peak Bandwidth:** 2,448 MB/s
- **Average IOPS:** 440
- **Average Latency:** ~36ms

### Step 29: Verify Proxmox Integration

**Check that all optimizations are visible in Proxmox GUI:**

1. **Navigate:** Ceph → Configuration Database
2. **Verify:** All optimization settings visible and applied
3. **Check:** No configuration errors or warnings
4. **Navigate:** Ceph → OSDs → Verify all 6 OSDs are visible and up

**Key optimizations to verify in GUI:**

- `osd_memory_target: 8589934592` (8GB per OSD)
- `bluestore_cache_size_ssd: 4294967296` (4GB cache)
- `bluestore_compression_algorithm: lz4`
- `cluster_network: 10.100.0.0/24` (TB4 mesh)
- `public_network: 10.11.12.0/24`

## Final Cluster Status

Your optimized TB4 + Ceph cluster should now provide:

- **High Performance:** 1,300+ MB/s write, 1,760+ MB/s read
- **Low Latency:** Sub-millisecond mesh, ~40ms storage
- **High Availability:** 3 monitors, 3 managers, automatic failover
- **Reliability:** 0% packet loss, persistent configuration
- **Full Integration:** Proxmox GUI visibility and management
