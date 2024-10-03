<?php

session_start();

header('Content-Type: text/plain');

$action = $_POST['action'] ?? 'run';
$cwd = $_SESSION['cwd'] ?? getcwd();

function safe_flush() {
    if (ob_get_level() > 0) {
        ob_flush();
        flush();
    }
}

function get_user_host_and_cwd() {
    $user = trim(exec('whoami'));
    $hostname = trim(gethostname());
    $cwd = trim(exec('pwd'));
    return [
        'user' => $user,
        'hostname' => $hostname,
        'cwd' => $cwd,
    ];
}

if ($action === 'initial') {
    $info = get_user_host_and_cwd();
    echo json_encode([
        'user' => $info['user'],
        'hostname' => $info['hostname'],
        'cwd' => $cwd,
    ]) . "\n";
    exit;
}

if ($action === 'run' && !empty($_POST['command'])) {
    $command = $_POST['command'];

    if (preg_match('/^cd\s+(.+)$/', $command, $matches)) {
        $dir = $matches[1];
        if ($dir === '~') {
            $cwd = getenv('HOME');
        } else {
            $newCwd = realpath($cwd . '/' . $dir);
            if ($newCwd && is_dir($newCwd)) {
                $cwd = $newCwd;
            } else {
                echo json_encode(['output' => "bash: cd: $dir: No such file or directory"]) . "\n";
                safe_flush();
                exit;
            }
        }
        $_SESSION['cwd'] = $cwd;
        echo json_encode([
            'output' => '',
            'user' => exec('whoami'),
            'hostname' => gethostname(),
            'cwd' => $cwd,
        ]) . "\n";
        safe_flush();
        exit;
    }

    $descriptors = [
        1 => ['pipe', 'w'], // stdout
        2 => ['pipe', 'w'], // stderr
    ];

    $process = proc_open($command, $descriptors, $pipes, $cwd);

    if (is_resource($process)) {
        $status = proc_get_status($process);
        $_SESSION['process'] = $status['pid'];

        while (!feof($pipes[1]) || !feof($pipes[2])) {
            $stdoutLine = fgets($pipes[1]);
            if ($stdoutLine !== false) {
                echo json_encode(['output' => $stdoutLine]) . "\n";
                safe_flush();
            }

            $stderrLine = fgets($pipes[2]);
            if ($stderrLine !== false) {
                echo json_encode(['output' => $stderrLine]) . "\n";
                safe_flush();
            }

            if (connection_aborted()) {
                break;
            }
        }

        fclose($pipes[1]);
        fclose($pipes[2]);

        proc_close($process);
        unset($_SESSION['process']);
    }
} elseif ($action === 'kill') {
    if (isset($_SESSION['process'])) {
        $pid = $_SESSION['process'];
        exec("kill -2 $pid");
        unset($_SESSION['process']);
        echo json_encode(['output' => "Process $pid interrupted"]) . "\n";
    } else {
        echo json_encode(['output' => 'No process running to kill']) . "\n";
    }
}

session_write_close();
