

let ui=(function()
{
    let elements={};
    elements.progressbar=$("#progressBar");
    elements.progressLabel=$("#progressLabel");
    elements.exposure=$("#exposure");
    elements.exposureLabel=$("#exposureLabel");
    elements.resolution=$("input[name=options]");
    elements.resolutionLabel=$("#resolutionLabel");
    elements.gpuRays=$("#gpuRays");
    elements.gpuRaysLabel=$("#gpuRaysLabel");
    elements.raydepth=$("#raydepth");
    elements.raydepthLabel=$("#raydepthLabel");

    elements.exposure.change(function()
    {
        elements.exposureLabel.text(elements.exposure.val());
    });
    elements.exposureLabel.text(elements.exposure.val());
    elements.gpuRays.change(function()
    {
        elements.gpuRaysLabel.text(elements.gpuRays.val()*1024);
    });
    elements.gpuRaysLabel.text(elements.gpuRays.val()*1024);
    elements.raydepth.change(function()
    {
        elements.raydepthLabel.text(elements.raydepth.val());
    });
    elements.raydepthLabel.text(elements.raydepth.val());
    function init()
    {
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
          });

    };
    function setProgress(value)
    {
        elements.progressbar.val(value);
        elements.progressLabel.text("Progress: "+value + "%");
    }
    function getExposure()
    {
        return elements.exposure.val();
    }
    function playAudio()
    {
        let audio=$("#playAudio")[0];
        audio.volume=0.015;
        audio.play();
    }
    function getParameters()
    {
        let parameters={};
        parameters.gpuBufferWidth=32;
        parameters.gpuBufferHeight=32;
        parameters.passes=elements.gpuRays.val();
        {
            let w=256;
            let h=256;
            elements.resolution.each(function(i,l)
            {
                if($(this).prop("checked")==true)
                {
                    w=$(this).data("w");
                    h=$(this).data("h");
                }
            })
        parameters.offscreenWidth=w;
        parameters.offscreenHeight=h;
        }
        parameters.passesPerBatch=10;
        parameters.sceneBounds=[-1,-1,1,1];
        parameters.rayDepth=elements.raydepth.val();
        return parameters;
    }
    setProgress(100);
    return {init:init,setProgress:setProgress,getParameters,getExposure:getExposure,playAudio:playAudio};
}
)();




export default ui;