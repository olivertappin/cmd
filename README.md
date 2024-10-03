# Debug Shell in a Container

This project provides a simple yet powerful command-line interface within a containerized environment. It's designed 
for DevOps, Site Reliability Engineers (SREs), and engineers who need to poke around and debug applications, 
environments, or microservices in cloud-based or containerized setups such as Kubernetes, Cloud Run, and other 
serverless platforms.

![Screenshot](https://github.com/user-attachments/assets/df3889de-178c-43c6-b140-79925ca27fa6)

## Features

- Access to a web-based terminal that mimics a typical command-line interface.
- Supports common commands and streamed output (e.g., `tail -f`).
- `Ctrl + C` for interrupting long-running commands.
- Handles both `stdout` and `stderr` streaming.
- Can be deployed in serverless environments like Google Cloud Run or Kubernetes to help debug multi-container setups or port exposure issues.

## Use Cases

- **Serverless Debugging**: Test, debug, and execute commands in environments like Cloud Run or Kubernetes.
- **Cloud Run Multi-Container Debugging**: For example, this tool can help you verify that different containers within a Cloud Run multi-container deployment are responding correctly on the expected ports.
- **Microservice Environments**: Use this tool to inspect and debug isolated services in distributed environments.
- **Kubernetes Pods**: Get shell access to containers running in Kubernetes clusters to check logs, connectivity, and more.
- **CI/CD Pipelines**: Debug issues directly in the environment where your code is running.

## Prerequisites

- Docker installed on your local machine.
- Basic knowledge of Docker and container management.

## Installation

To build and run the container locally, follow these steps:

### Build the Docker Image

```bash
docker build -t cmd .
```

### Run the Docker Container

```bash
docker run -d -p 8089:80 --name cmd cmd
```

This will start the container and expose the terminal interface on port `8089` of your local machine. Access the 
interface by visiting `http://localhost:8089` in your browser.

## Usage
Once the container is running, you can:

1. Visit http://localhost:8089 to access the web-based terminal.
2. Use it like a normal terminal to run commands such as:
  - `ls`
  - `tail -f /path/to/logfile`
  - `apt-get update`
  - `curl http://example.com`
3. Interrupt long-running commands with `Ctrl + C` to mimic real terminal behavior.

The terminal also supports streamed output, which is useful for commands like `tail -f` or to monitor logs or processes 
in real time.

### Debugging Cloud Run Multiple Container Deployments

You can use this tool to debug multi-container setups in serverless environments. For example, when deploying multiple 
containers on Google Cloud Run, use the terminal to ensure that services within the containers are properly exposed and 
responding on the correct ports.

Example:

```bash
curl http://localhost:8080/api
```

This allows you to validate whether your service is communicating with another container properly.

### Rebuilding the Container

If you need to make changes or rebuild the container, use the following commands:

```bash
docker stop cmd
docker rm cmd
docker build -t cmd .
docker run -d -p 8089:80 --name cmd cmd
```

This will stop the currently running container, rebuild the image, and start a new container.

### Contributions

Please open a GitHub issue for discussion before opening a pull-request.

Once created, create your branch in the following format: `{feature|hotfix}/{github-issue-number}` and open the 
relevant pull-request into the master branch for review.

All contributions, no matter how large or small, are welcome.
