
using FinTrak.Core.DTOs;
using FinTrak.Core.Entities;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace FinTrak.Infrastructure.Utilities;

public class RuleFieldMapDeserializer
{
    public Dictionary<TargetType, RuleFieldMapDto> ParseRuleFieldmap()
    {
        //Because CopyToOutputDirectory="PreserveNewest" is set on rulefieldmap.json, the file will get copied and placed next to FinTrak.Api.dll. That will be when this code runs, making relative path searching completely useless.
        //AppContext.BaseDirectory always points to the folder containing the running .dll, combining with the filename will point us straight to the file.
        var path = Path.Combine(AppContext.BaseDirectory, "rulefieldmap.json");
        var file = File.ReadAllText(path);

        if(file is null)
        {
            throw new FileNotFoundException($"Config file not found at path {path}");
        }

        var result = JsonConvert.DeserializeObject<Dictionary<TargetType, RuleFieldMapDto>>(file, new StringEnumConverter());

        if(result is null)
        {
            throw new InvalidOperationException();
        }

        return result;
    }
    
}
