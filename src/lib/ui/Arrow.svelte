<script>
    import Icon from "$lib/ui/Icon.svelte";

    export let animate = true;
</script>

<span class="arrow" class:bounce={animate}>
    <Icon type="arrow" rotation={90}/>
</span>

<style>
    .arrow {
        display: block;
        font-size: 2em;
    }
    .bounce {
        -webkit-animation-duration: 2s;
        animation-duration: 2s;
        -webkit-animation-iteration-count: infinite;
        animation-iteration-count: infinite;
        -webkit-animation-name: bounce;
        animation-name: bounce;
        -webkit-animation-timing-function: ease;
        animation-timing-function: ease;
    }
    @-webkit-keyframes bounce {
        0% {
            -webkit-transform: translateY(10px);
            transform: translateY(10px);
        }
        30% {
            -webkit-transform: translateY(-10px);
            transform: translateY(-10px);
        }
        50% {
            -webkit-transform: translateY(10px);
            transform: translateY(10px);
        }
        100% {
            -webkit-transform: translateY(10px);
            transform: translateY(10px);
        }
    }
    @keyframes bounce {
        0% {
            -webkit-transform: translateY(10px);
            transform: translateY(10px);
        }
        30% {
            -webkit-transform: translateY(-10px);
            transform: translateY(-10px);
        }
        50% {
            -webkit-transform: translateY(10px);
            transform: translateY(10px);
        }
        100% {
            -webkit-transform: translateY(10px);
            transform: translateY(10px);
        }
    }
</style>
