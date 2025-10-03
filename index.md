---
layout: default
title: Home
nav_order: 0
author: Timothy Schneider
email: tim@taslabs.net
url: https://taslabs.net
---

# Thunderbolt 4 + Ceph Guide for Proxmox VE 9

This guide provides a **step-by-step, tested setup** for building a high-performance Thunderbolt 4 +
Ceph cluster on Proxmox VE 9.0.10.

## Implementation Phases

This guide follows a **5-phase implementation approach** for building your Thunderbolt 4 + Ceph
cluster:

### Phase 0: [Prerequisites and Planning]({{ site.baseurl }}/prerequisites/)

Hardware requirements, network planning, and environment preparation

### Phase 1: TB4 Foundation Setup

- **[1A: TB4 Hardware Detection]({{ site.baseurl }}/tb4-hardware-detection/)** - Kernel modules,
  hardware identification, and systemd links
- **[1B: TB4 Network Configuration]({{ site.baseurl }}/tb4-network-configuration/)** - Interface
  configuration, systemd networking, and udev automation
- **[1C: TB4 System Integration]({{ site.baseurl }}/tb4-system-integration/)** - Initramfs updates,
  system configuration, and final integration

### Phase 2: [SDN OpenFabric Configuration]({{ site.baseurl }}/sdn-openfabric/)

Proxmox SDN fabric creation, node registration, and routing setup

### Phase 3: [Mesh Testing and Validation]({{ site.baseurl }}/mesh-testing/)

Connectivity verification, performance testing, and mesh validation

### Phase 4: Ceph Cluster Setup

- **[4A: Ceph Installation]({{ site.baseurl }}/ceph-installation/)** - Initial Ceph installation and
  first monitor setup
- **[4B: Ceph Network Configuration]({{ site.baseurl }}/ceph-network-configuration/)** - Network
  settings and additional monitors
- **[4C: Ceph Storage Setup]({{ site.baseurl }}/ceph-storage-setup/)** - OSD creation, storage
  pools, and Proxmox integration

### Phase 5: [Performance Optimization]({{ site.baseurl }}/performance-optimization/)

High-performance tuning, benchmarking, and production optimizations

---

### Reference: [Troubleshooting]({{ site.baseurl }}/troubleshooting/)

Common issues and solutions (consult as needed)

## Getting Started

**Ready to build your high-performance TB4 + Ceph cluster?**

**[Start with Prerequisites and Planning]({{ site.baseurl }}/prerequisites/)** and work through each
section sequentially.

This guide has been tested and refined to provide reliable, step-by-step instructions for building a
production-ready cluster.

## Lab Results

- **TB4 Mesh Performance:** Sub-millisecond latency, 65520 MTU, full mesh connectivity
- **Ceph Performance:** 1,300+ MB/s write, 1,760+ MB/s read with optimizations
- **Reliability:** 0% packet loss, automatic failover, persistent configuration
- **Integration:** Full Proxmox GUI visibility and management

## Hardware Environment (Tested)

- **Nodes:** 3x systems with dual TB4 ports (tested on MS01 mini-PCs)
- **Memory:** 64GB+ RAM per node (optimal for high-performance Ceph)
- **CPU:** 13th Gen Intel (or equivalent high-performance processors)
- **Storage:** 2x NVMe drives per node for Ceph OSDs (6 OSDs total)
- **Network Architecture:**
  - **Cluster Management:** 10.11.11.0/24 - Proxmox cluster communication and SSH
  - **VM/Public Network:** 10.1.1.0/24 - VM traffic and Ceph public network (client I/O)
  - **Ceph Cluster Network (TB4):** 10.100.0.0/24 - OSD replication traffic only

## Acknowledgments

**Guide Author:** Timothy Schneider ([tim@taslabs.net](mailto:tim@taslabs.net) |
[taslabs.net](https://taslabs.net))

**This builds upon excellent foundational work by @scyto:**

- Original TB4 research:
  [https://gist.github.com/scyto/76e94832927a89d977ea989da157e9dc](https://gist.github.com/scyto/76e94832927a89d977ea989da157e9dc)

**Key contributions from @scyto's work:**

- TB4 hardware detection and kernel module strategies
- Systemd networking and udev automation techniques
- MTU optimization and performance tuning approaches
