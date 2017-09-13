export function collate (stream)
{
    return stream.scan((state, data) => {
        let index = data.lastIndexOf('\n');
        if (index >= 0)
        {
            return {
                finishedLine: state.buffer + data.substring(0, index+1),
                buffer: data.substring(index+1)
            };
        }
        else
        {
            return { buffer: data };
        }
    }, { buffer: "" } ).filter(x => x.finishedLine).map(x => x.finishedLine.split('\n').filter (i => i.length > 0));
}
