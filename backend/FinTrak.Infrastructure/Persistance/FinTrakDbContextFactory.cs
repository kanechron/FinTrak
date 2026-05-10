using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FinTrak.Infrastructure.Persistance
{
    /// <summary>
    /// Used by EF Core tooling (migrations) to instantiate FinTrakDbContext at design time.
    /// Reads connection details from the .env file in the solution root.
    /// </summary>
    public class FinTrakDbContextFactory : IDesignTimeDbContextFactory<FinTrakDbContext>
    {
        public FinTrakDbContext CreateDbContext(string[] args)
        {
            var env = LoadEnvFile(FindEnvFile());

            var host = env.GetValueOrDefault("POSTGRES_HOST", "localhost");
            var port = env.GetValueOrDefault("POSTGRES_PORT", "5432");
            var db = env["POSTGRES_DB"];
            var user = env["POSTGRES_USER"];
            var password = env["POSTGRES_PASSWORD"];

            var connectionString = $"Host={host};Port={port};Database={db};Username={user};Password={password}";

            var options = new DbContextOptionsBuilder<FinTrakDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            return new FinTrakDbContext(options);
        }

        private static Dictionary<string, string> LoadEnvFile(string path)
        {
            var result = new Dictionary<string, string>();
            foreach (var line in File.ReadAllLines(path))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;

                var separatorIndex = trimmed.IndexOf('=');
                if (separatorIndex < 0) continue;

                var key = trimmed[..separatorIndex].Trim();
                var rawValue = trimmed[(separatorIndex + 1)..].Trim();

                string value;
                if (rawValue.StartsWith('"') || rawValue.StartsWith('\''))
                {
                    // Quoted value — strip surrounding quotes, preserve everything inside
                    value = rawValue.Trim('"').Trim('\'');
                }
                else
                {
                    // Unquoted value — strip inline comments (# and everything after)
                    var commentIndex = rawValue.IndexOf('#');
                    value = commentIndex >= 0 ? rawValue[..commentIndex].TrimEnd() : rawValue;
                }

                result[key] = value;
            }
            return result;
        }

        private static string FindEnvFile()
        {
            var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
            while (dir != null)
            {
                var envFile = Path.Combine(dir.FullName, ".env");
                if (File.Exists(envFile)) return envFile;
                dir = dir.Parent;
            }
            throw new FileNotFoundException(".env file not found in directory tree.");
        }
    }
}
