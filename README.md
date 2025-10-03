# Thunderbolt 4 + Ceph Guide for Proxmox VE 9

This guide provides a **step-by-step, tested setup** for building a high-performance Thunderbolt 4 +
Ceph cluster on Proxmox VE 9.0.10.

## Live Documentation

**[View the complete guide at https://tb4.git.taslabs.net](https://tb4.git.taslabs.net)**

The live documentation provides the best reading experience with:

- Clean, organized navigation
- Search functionality
- Mobile-responsive design
- Easy step-by-step progression

**Guide Author:** Timothy Schneider ([tim@taslabs.net](mailto:tim@taslabs.net) |
[taslabs.net](https://taslabs.net))

## Quick Overview

The guide is organized into 5 phases with 11 focused sections:

- **Phase 0:** Prerequisites and Planning
- **Phase 1:** TB4 Foundation Setup (3 sections)
- **Phase 2:** SDN OpenFabric Configuration
- **Phase 3:** Mesh Testing and Validation
- **Phase 4:** Ceph Cluster Setup (3 sections)
- **Phase 5:** Performance Optimization
- **Reference:** Troubleshooting

## Lab Results

- **TB4 Mesh Performance:** Sub-millisecond latency, 65520 MTU, full ring mesh connectivity
- **Ceph Performance:** 1,300+ MB/s write, 1,760+ MB/s read with optimizations
- **Network Separation:** TB4 dedicated to OSD replication, separate public network for client I/O
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

## Architecture Highlights

**Network Separation Design:**

- **Cluster Management (10.11.11.0/24):** Proxmox cluster communication and SSH access
- **VM/Public Network (10.1.1.0/24):** VM traffic and Ceph public network for client I/O
- **TB4 Cluster Network (10.100.0.0/24):** Dedicated 40Gbps TB4 mesh for OSD-to-OSD replication
- **Benefits:** OSD replication isolated from client I/O, all Proxmox nodes can access Ceph storage

**Triangle Topology:**

```
n2 ←→ n3 ←→ n4 ←→ n2
```

Each node connects to 2 neighbors via TB4, forming a redundant triangle mesh with automatic
failover.

## Acknowledgments

**This builds upon excellent foundational work by @scyto:**

- Original TB4 research: https://gist.github.com/scyto/76e94832927a89d977ea989da157e9dc

**Key contributions from @scyto's work:**

- TB4 hardware detection and kernel module strategies
- Systemd networking and udev automation techniques
- MTU optimization and performance tuning approaches

## Getting Started

**[Start with the Prerequisites section on the live site](https://tb4.git.taslabs.net/prerequisites/)**
and work through each section sequentially.

The live documentation provides the best experience with proper navigation, search, and mobile
support.
