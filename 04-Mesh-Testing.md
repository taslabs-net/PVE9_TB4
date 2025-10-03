---
layout: page
title: 'Step 4: Mesh Testing and Validation'
permalink: /mesh-testing/
nav_order: 6
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Phase 3: Mesh Testing and Validation

## Step 13: Verify TB4 Interface Configuration

**Check TB4 interfaces are up with correct settings:**

```bash
for node in n2 n3 n4; do
  echo "=== TB4 interfaces on $node ==="
  ssh $node "ip addr show | grep -E '(en05|en06|10\.100\.0\.)'"
done
```

**Expected output example (n2):**

```
=== TB4 interfaces on n2 ===
    inet 10.100.0.12/32 scope global dummy_tb4
11: en05: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 65520 qdisc fq_codel state UP group default qlen 1000
    inet 10.100.0.1/30 scope global en05
12: en06: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 65520 qdisc fq_codel state UP group default qlen 1000
    inet 10.100.0.5/30 scope global en06
```

## Step 14: Test Router ID Connectivity

**Test mesh connectivity via OpenFabric router IDs:**

```bash
# Test from n2 to all router IDs:
for target in 10.100.0.12 10.100.0.13 10.100.0.14; do
  echo "=== Testing connectivity to $target ==="
  ssh n2 "ping -c 3 $target"
  echo
done
```

**Expected results:**

```
=== Testing connectivity to 10.100.0.12 ===
PING 10.100.0.12 (10.100.0.12) 56(84) bytes of data.
64 bytes from 10.100.0.12: icmp_seq=1 ttl=64 time=0.615 ms
64 bytes from 10.100.0.12: icmp_seq=2 ttl=64 time=0.591 ms
64 bytes from 10.100.0.12: icmp_seq=3 ttl=64 time=0.595 ms
--- 10.100.0.12 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms

=== Testing connectivity to 10.100.0.13 ===
PING 10.100.0.13 (10.100.0.13) 56(84) bytes of data.
64 bytes from 10.100.0.13: icmp_seq=1 ttl=64 time=0.634 ms
64 bytes from 10.100.0.13: icmp_seq=2 ttl=64 time=0.611 ms
64 bytes from 10.100.0.13: icmp_seq=3 ttl=64 time=0.598 ms
--- 10.100.0.13 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2004ms

=== Testing connectivity to 10.100.0.14 ===
PING 10.100.0.14 (10.100.0.14) 56(84) bytes of data.
64 bytes from 10.100.0.14: icmp_seq=1 ttl=64 time=0.663 ms
64 bytes from 10.100.0.14: icmp_seq=2 ttl=64 time=0.622 ms
64 bytes from 10.100.0.14: icmp_seq=3 ttl=64 time=0.581 ms
--- 10.100.0.14 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2004ms
```

## Step 15: Test All-to-All Connectivity

**Comprehensive mesh connectivity test:**

```bash
# Test all router ID combinations:
for source in n2 n3 n4; do
  for target in 10.100.0.12 10.100.0.13 10.100.0.14; do
    echo "=== $source -> $target ==="
    ssh $source "ping -c 2 $target | tail -n 2"
    echo
  done
done
```

**Expected:** Round-trip times under 1ms consistently.

## Step 16: Verify OpenFabric Routing

**Check FRR OpenFabric routing tables:**

```bash
# Check routing on all nodes:
for node in n2 n3 n4; do
  echo "=== OpenFabric routing on $node ==="
  ssh $node "vtysh -c 'show openfabric topology'"
  echo
done
```

**Alternative routing check:**

```bash
# Check IP routing tables:
for node in n2 n3 n4; do
  echo "=== IP routes on $node ==="
  ssh $node "ip route show | grep 10.100.0"
done
```

## Performance Validation

The TB4 mesh should now provide:

- **Latency:** Sub-millisecond round-trip times
- **Bandwidth:** Full TB4 throughput capabilities
- **Reliability:** 0% packet loss under normal conditions
- **Redundancy:** Automatic failover if one TB4 connection fails

**Your TB4 OpenFabric mesh is ready for Ceph integration!**
