import { Host } from '@/models/Host';
import { Network } from '@/models/Network';
import { Node } from '@/models/Node';
import { useLoadGraph } from '@react-sigma/core';
import Graph from 'graphology';
import { useCallback, useEffect } from 'react';
import circular from 'graphology-layout/circular';

interface NetworkGraphProps {
  network: Network;
  hosts: Host[];
  nodes: Node[];
}

export default function NetworkGraph({ hosts, nodes }: NetworkGraphProps) {
  const loadGraph = useLoadGraph();

  const renderNodes = useCallback((graph: Graph, nodes: Node[], nodeToHostMap: Record<Node['id'], Host>) => {
    // render nodes
    nodes.forEach((node) => {
      const nodeLabel = nodeToHostMap[node.id].name;

      graph.addNode(node.id, {
        x: Math.round(Math.random() * 100),
        y: Math.round(Math.random() * 100),
        size: 15,
        label: nodeLabel,
        color: '#FA4F40',
      });
    });
  }, []);

  useEffect(() => {
    const graph = new Graph();

    const nodeToHostMap = nodes.reduce((acc, node) => {
      acc[node.id] = hosts.find((host) => host.id === node.hostid)!;
      return acc;
    }, {} as Record<Node['id'], Host>);

    // render nodes
    circular.assign(graph);
    renderNodes(graph, nodes, nodeToHostMap);

    // graph.addNode('first', { x: 0, y: 0, size: 15, label: 'My first node', color: '#FA4F40' });
    // graph.addNode('second', { x: 10, y: 10, size: 15, label: 'My first node', color: '#FA4F40' });
    loadGraph(graph);
  }, [hosts, loadGraph, nodes, renderNodes]);

  return null;
}
