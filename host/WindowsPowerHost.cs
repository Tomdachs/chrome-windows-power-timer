using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

internal static class WindowsPowerHost
{
    private const string Version = "0.1.1";
    private const int MaxMessageBytes = 64 * 1024;

    public static int Main()
    {
        try
        {
            string request = ReadMessage(Console.OpenStandardInput());
            string command = ReadJsonString(request, "command");

            if (command == "ping")
            {
                WriteMessage(Console.OpenStandardOutput(), "{\"ok\":true,\"version\":\"" + Version + "\"}");
                return 0;
            }

            if (command != "execute")
            {
                WriteError("Unsupported command.");
                return 2;
            }

            string action = ReadJsonString(request, "action");
            if (action != "sleep" && action != "shutdown")
            {
                WriteError("Unsupported action.");
                return 2;
            }

            WriteMessage(Console.OpenStandardOutput(), "{\"ok\":true,\"action\":\"" + action + "\"}");
            Thread.Sleep(500);

            if (action == "sleep")
            {
                if (!Application.SetSuspendState(PowerState.Suspend, false, false))
                    throw new InvalidOperationException("Windows rejected the sleep request.");
            }
            else
            {
                StartShutdown();
            }

            return 0;
        }
        catch (Exception ex)
        {
            try { WriteError(ex.Message); } catch { }
            return 1;
        }
    }

    private static string ReadMessage(Stream input)
    {
        byte[] header = ReadExact(input, 4);
        int length = BitConverter.ToInt32(header, 0);
        if (length <= 0 || length > MaxMessageBytes)
            throw new InvalidDataException("Invalid native-message length.");
        return Encoding.UTF8.GetString(ReadExact(input, length));
    }

    private static byte[] ReadExact(Stream stream, int length)
    {
        byte[] buffer = new byte[length];
        int offset = 0;
        while (offset < length)
        {
            int read = stream.Read(buffer, offset, length - offset);
            if (read <= 0) throw new EndOfStreamException("Unexpected end of native message.");
            offset += read;
        }
        return buffer;
    }

    private static void WriteMessage(Stream output, string json)
    {
        byte[] payload = Encoding.UTF8.GetBytes(json);
        byte[] header = BitConverter.GetBytes(payload.Length);
        output.Write(header, 0, header.Length);
        output.Write(payload, 0, payload.Length);
        output.Flush();
    }

    private static void WriteError(string message)
    {
        WriteMessage(Console.OpenStandardOutput(), "{\"ok\":false,\"error\":\"" + EscapeJson(message) + "\"}");
    }

    private static string ReadJsonString(string json, string property)
    {
        Match match = Regex.Match(json,
            "\\\"" + Regex.Escape(property) + "\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"",
            RegexOptions.CultureInvariant);
        if (!match.Success) return null;
        return Regex.Unescape(match.Groups[1].Value);
    }

    private static string EscapeJson(string value)
    {
        if (value == null) return String.Empty;
        return value.Replace("\\", "\\\\")
            .Replace("\"", "\\\"")
            .Replace("\r", "\\r")
            .Replace("\n", "\\n");
    }

    private static void StartShutdown()
    {
        string shutdownExe = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.System),
            "shutdown.exe");
        ProcessStartInfo info = new ProcessStartInfo
        {
            FileName = shutdownExe,
            Arguments = "/s /t 0",
            UseShellExecute = false,
            CreateNoWindow = true
        };
        Process process = Process.Start(info);
        if (process == null) throw new InvalidOperationException("Could not start shutdown.exe.");
    }
}
