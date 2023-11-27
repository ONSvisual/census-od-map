<div class="mask">
    <div class="spinner"/>
</div>

<style>
    .mask {
        position: fixed;
        z-index: 100;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .mask::before {
        content: " ";
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: var(--background, #222);
        opacity: 0.7;
    }
    .spinner {
        width: 2rem;
        height: 2rem;
        border: 4px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spinner .75s linear infinite;
    }
    @keyframes spinner {
        to { transform: rotate(360deg); }
    }
</style>